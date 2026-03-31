import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SIMULATE_PAYMENTS, getStripe } from "@/lib/stripe";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET - Liste des utilisateurs
export async function GET(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filter === "subscribed") {
    where.subscription = { status: "ACTIVE" };
  } else if (filter === "free") {
    where.subscription = null;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
      },
      _count: {
        select: { purchases: true },
      },
    },
  });

  return NextResponse.json({ users, total: users.length });
}

// PATCH - Modifier le rôle d'un utilisateur
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { userId, role } = await req.json();

    if (!userId || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Empêcher de se retirer admin soi-même
    if (userId === session.user.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer votre propre rôle admin." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Empêcher de se supprimer soi-même
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte." },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe + récupérer son abonnement
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Résilier l'abonnement Stripe s'il en a un
    if (user.subscription?.stripeSubscriptionId && !SIMULATE_PAYMENTS) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
      } catch (stripeErr) {
        console.error("[DELETE USER] Erreur résiliation Stripe:", stripeErr);
        // On continue la suppression même si Stripe échoue
      }
    }

    // Supprimer (cascade supprime subscriptions, purchases, progress, etc.)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vérification admin
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET - Récupérer tout le contenu
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const entries = await prisma.siteContent.findMany();
    const content: Record<string, string> = {};
    for (const e of entries) content[e.key] = e.value;
    return NextResponse.json(content);
  } catch (error) {
    console.error("[ADMIN_CONTENT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// PUT - Mise à jour en lot du contenu
export async function PUT(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { entries } = await req.json();

    if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    // Validation des clés et valeurs
    const ALLOWED_KEY_PATTERN = /^[a-zA-Z0-9_.-]{1,100}$/;
    for (const [key, value] of Object.entries(entries)) {
      if (!ALLOWED_KEY_PATTERN.test(key)) {
        return NextResponse.json(
          { error: `Clé invalide : ${key}` },
          { status: 400 }
        );
      }
      if (typeof value !== "string" || value.length > 10000) {
        return NextResponse.json(
          { error: `Valeur invalide pour la clé : ${key}` },
          { status: 400 }
        );
      }
    }

    const ops = Object.entries(entries).map(([key, value]) =>
      prisma.siteContent.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    );

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_CONTENT_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

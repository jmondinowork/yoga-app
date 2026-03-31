import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

// Vérification admin
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

// Schémas de validation
const createSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  rating: z.number().int().min(1).max(5).default(5),
  isVisible: z.boolean().default(true),
});

const updateSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isVisible: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1, "L'identifiant est requis"),
});

// GET - Liste des témoignages
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("[ADMIN_TESTIMONIALS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// POST - Créer un témoignage
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const testimonial = await prisma.testimonial.create({ data });
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_TESTIMONIAL_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un témoignage
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = updateSchema.parse(body);

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_TESTIMONIAL_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un témoignage
export async function DELETE(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = deleteSchema.parse(body);

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_TESTIMONIAL_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

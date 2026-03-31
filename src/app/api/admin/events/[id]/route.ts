import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  meetingLink: z.string().url().optional(),
  startTime: z.string().datetime().optional(),
  duration: z.number().int().positive().optional(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEnd: z.string().datetime().optional().nullable(),
  maxParticipants: z.number().int().positive().optional(),
  theme: z.string().min(2).optional(),
  isPublished: z.boolean().optional(),
});

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET - Détail d'un événement
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const event = await prisma.liveEvent.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          where: { cancelledAt: null },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { occurrenceDate: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[ADMIN_EVENT_DETAIL_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier un événement
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateEventSchema.parse(body);

    const existing = await prisma.liveEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    // Auto-regenerate slug if title changed
    let slugUpdate: { slug?: string } = {};
    if (data.title && data.title !== existing.title) {
      let newSlug = generateSlug(data.title);
      const slugExists = await prisma.liveEvent.findUnique({ where: { slug: newSlug } });
      if (slugExists && slugExists.id !== id) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      slugUpdate = { slug: newSlug };
    }

    const event = await prisma.liveEvent.update({
      where: { id },
      data: {
        ...data,
        ...slugUpdate,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        recurrenceEnd:
          data.recurrenceEnd !== undefined
            ? data.recurrenceEnd
              ? new Date(data.recurrenceEnd)
              : null
            : undefined,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_EVENT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.liveEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  await prisma.liveEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

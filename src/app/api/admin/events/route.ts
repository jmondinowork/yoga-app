import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod/v4";

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description est trop courte"),
  meetingLink: z.string().url("Lien de visioconférence invalide"),
  startTime: z.string().datetime(),
  duration: z.number().int().positive("La durée doit être positive"),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
  recurrenceEnd: z.string().datetime().optional().nullable(),
  maxParticipants: z.number().int().positive().default(20),
  theme: z.string().min(2),
  isPublished: z.boolean().default(false),
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

// GET - Liste des événements
export async function GET(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { theme: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [events, total] = await Promise.all([
      prisma.liveEvent.findMany({
        where,
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          meetingLink: true,
          startTime: true,
          duration: true,
          recurrence: true,
          recurrenceEnd: true,
          maxParticipants: true,
          theme: true,
          isPublished: true,
          createdAt: true,
          _count: {
            select: { registrations: { where: { cancelledAt: null } } },
          },
        },
      }),
      prisma.liveEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_EVENTS_LIST_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un événement
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = eventSchema.parse(body);

    // Auto-generate slug from title
    let slug = generateSlug(data.title);
    const existingSlug = await prisma.liveEvent.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await prisma.liveEvent.create({
      data: {
        ...data,
        slug,
        startTime: new Date(data.startTime),
        recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[ADMIN_EVENT_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}

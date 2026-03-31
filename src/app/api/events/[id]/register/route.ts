import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidOccurrence } from "@/lib/calendar";

// POST - S'inscrire à un événement
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { occurrenceDate } = await req.json();
    if (!occurrenceDate) {
      return NextResponse.json(
        { error: "Date d'occurrence requise" },
        { status: 400 }
      );
    }

    const date = new Date(occurrenceDate);
    if (date <= new Date()) {
      return NextResponse.json(
        { error: "Impossible de s'inscrire à un événement passé" },
        { status: 400 }
      );
    }

    const event = await prisma.liveEvent.findUnique({ where: { id } });
    if (!event || !event.isPublished) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Validate occurrence date
    if (!isValidOccurrence(event, date)) {
      return NextResponse.json(
        { error: "Date d'occurrence invalide" },
        { status: 400 }
      );
    }

    // Check for existing registration (including cancelled)
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId_occurrenceDate: {
          userId: session.user.id,
          eventId: id,
          occurrenceDate: date,
        },
      },
    });

    if (existing && !existing.cancelledAt) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit(e) à cet événement" },
        { status: 409 }
      );
    }

    // Check max participants
    const currentCount = await prisma.eventRegistration.count({
      where: {
        eventId: id,
        occurrenceDate: date,
        cancelledAt: null,
      },
    });

    if (currentCount >= event.maxParticipants) {
      return NextResponse.json(
        { error: "Plus de places disponibles" },
        { status: 409 }
      );
    }

    // Re-activate cancelled registration or create new one
    if (existing) {
      await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { cancelledAt: null },
      });
    } else {
      await prisma.eventRegistration.create({
        data: {
          userId: session.user.id,
          eventId: id,
          occurrenceDate: date,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[EVENT_REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler son inscription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { occurrenceDate } = await req.json();
    const date = new Date(occurrenceDate);

    // Check cancellation is at least 1h before event
    const oneHourBefore = new Date(date.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBefore) {
      return NextResponse.json(
        { error: "Annulation impossible moins d'1h avant le cours" },
        { status: 400 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId_occurrenceDate: {
          userId: session.user.id,
          eventId: id,
          occurrenceDate: date,
        },
      },
    });

    if (!registration || registration.cancelledAt) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      );
    }

    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { cancelledAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EVENT_CANCEL_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

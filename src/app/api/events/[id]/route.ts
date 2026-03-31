import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/events/[id]?date=...
// Returns event detail. Includes zoomLink only if user is registered
// and the event starts within 30 minutes.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  const event = await prisma.liveEvent.findUnique({
    where: { id, isPublished: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  let meetingLink: string | null = null;
  let isRegistered = false;

  const session = await auth();
  if (session?.user?.id && dateParam) {
    const date = new Date(dateParam);
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId_occurrenceDate: {
          userId: session.user.id,
          eventId: id,
          occurrenceDate: date,
        },
      },
    });

    isRegistered = !!registration && !registration.cancelledAt;

    // Show zoom link 30 min before event
    if (isRegistered) {
      const thirtyMinBefore = new Date(date.getTime() - 30 * 60 * 1000);
      const eventEnd = new Date(date.getTime() + event.duration * 60 * 1000);
      const now = new Date();
      if (now >= thirtyMinBefore && now <= eventEnd) {
        meetingLink = event.meetingLink;
      }
    }
  }

  return NextResponse.json({
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    duration: event.duration,
    theme: event.theme,
    maxParticipants: event.maxParticipants,
    meetingLink,
    isRegistered,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOccurrences } from "@/lib/calendar";

// GET /api/events?month=2026-04
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  let rangeStart: Date;
  let rangeEnd: Date;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, m] = month.split("-").map(Number);
    // Include surrounding days for calendar display
    rangeStart = new Date(Date.UTC(year, m - 1, 1));
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd = new Date(Date.UTC(year, m, 0));
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    rangeEnd.setHours(23, 59, 59, 999);
  } else {
    // Default: current month
    const now = new Date();
    rangeStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Fetch all published events that could have occurrences in range
  // Only select needed registration fields instead of full records
  const events = await prisma.liveEvent.findMany({
    where: {
      isPublished: true,
      OR: [
        // Non-recurring events in range
        { recurrence: "NONE", startTime: { gte: rangeStart, lte: rangeEnd } },
        // Recurring events that started before range end
        {
          recurrence: { not: "NONE" },
          startTime: { lte: rangeEnd },
          OR: [
            { recurrenceEnd: null },
            { recurrenceEnd: { gte: rangeStart } },
          ],
        },
      ],
    },
    include: {
      registrations: {
        where: userId
          ? { OR: [{ cancelledAt: null }, { userId }] }
          : { cancelledAt: null },
        select: { id: true, userId: true, occurrenceDate: true, cancelledAt: true },
      },
    },
  });

  const occurrences = generateOccurrences(events, rangeStart, rangeEnd, userId);

  // Don't expose zoom link in list view
  const result = occurrences.map((occ) => ({
    eventId: occ.event.id,
    title: occ.event.title,
    slug: occ.event.slug,
    description: occ.event.description,
    date: occ.date.toISOString(),
    duration: occ.event.duration,
    theme: occ.event.theme,
    maxParticipants: occ.event.maxParticipants,
    registrationCount: occ.registrationCount,
    spotsLeft: occ.event.maxParticipants - occ.registrationCount,
    isRegistered: occ.isRegistered,
    isCancelled: occ.isCancelled,
  }));

  const response = NextResponse.json({ events: result });
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return response;
}

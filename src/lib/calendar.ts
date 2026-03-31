import type { LiveEvent, EventRegistration } from "@prisma/client";

export interface EventOccurrence {
  event: LiveEvent;
  date: Date;
  registrationCount: number;
  isRegistered: boolean;
  isCancelled: boolean;
}

/**
 * Generate all occurrences of events within a date range.
 * Recurring events are expanded into individual occurrences.
 */
export function generateOccurrences(
  events: (LiveEvent & { registrations: EventRegistration[] })[],
  rangeStart: Date,
  rangeEnd: Date,
  userId?: string
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];

  for (const event of events) {
    const dates = getOccurrenceDates(event, rangeStart, rangeEnd);

    for (const date of dates) {
      const dateStr = date.toISOString();
      const regs = event.registrations.filter(
        (r) =>
          r.occurrenceDate.toISOString() === dateStr && !r.cancelledAt
      );
      const userReg = userId
        ? event.registrations.find(
            (r) =>
              r.userId === userId &&
              r.occurrenceDate.toISOString() === dateStr
          )
        : undefined;

      occurrences.push({
        event,
        date,
        registrationCount: regs.length,
        isRegistered: !!userReg && !userReg.cancelledAt,
        isCancelled: !!userReg?.cancelledAt,
      });
    }
  }

  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get all occurrence dates for an event within a range.
 */
function getOccurrenceDates(
  event: LiveEvent,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const start = new Date(event.startTime);
  const end = event.recurrenceEnd
    ? new Date(Math.min(event.recurrenceEnd.getTime(), rangeEnd.getTime()))
    : rangeEnd;

  if (event.recurrence === "NONE") {
    if (start >= rangeStart && start <= rangeEnd) {
      return [start];
    }
    return [];
  }

  const dates: Date[] = [];
  const current = new Date(start);

  // If start is before range, advance to first occurrence in range
  while (current < rangeStart) {
    advanceDate(current, event.recurrence);
  }

  while (current <= end) {
    dates.push(new Date(current));
    advanceDate(current, event.recurrence);
  }

  return dates;
}

function advanceDate(
  date: Date,
  recurrence: "DAILY" | "WEEKLY" | "MONTHLY"
): void {
  switch (recurrence) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
  }
}

/**
 * Check if a specific date is a valid occurrence for an event.
 */
export function isValidOccurrence(event: LiveEvent, date: Date): boolean {
  const start = new Date(event.startTime);

  if (event.recurrenceEnd && date > event.recurrenceEnd) return false;
  if (date < start) return false;

  if (event.recurrence === "NONE") {
    return start.toISOString() === date.toISOString();
  }

  // Check that the date falls on a valid recurrence
  const diff = date.getTime() - start.getTime();
  const dayMs = 86400000;

  switch (event.recurrence) {
    case "DAILY":
      return diff % dayMs === 0;
    case "WEEKLY":
      return diff % (7 * dayMs) === 0;
    case "MONTHLY": {
      return (
        date.getUTCDate() === start.getUTCDate() &&
        date.getUTCHours() === start.getUTCHours() &&
        date.getUTCMinutes() === start.getUTCMinutes()
      );
    }
    default:
      return false;
  }
}

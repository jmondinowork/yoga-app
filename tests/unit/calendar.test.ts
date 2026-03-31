import { describe, it, expect } from 'vitest';
import type { LiveEvent, EventRegistration } from '@prisma/client';

function makeEvent(overrides: Partial<LiveEvent> = {}): LiveEvent {
  return {
    id: 'event-1',
    title: 'Yoga Doux',
    slug: 'yoga-doux',
    description: 'Un cours de yoga doux pour tous niveaux',
    meetingLink: 'https://meet.example.com/yoga',
    startTime: new Date('2026-04-07T09:00:00Z'),
    duration: 60,
    recurrence: 'NONE',
    recurrenceEnd: null,
    maxParticipants: 20,
    isPublished: true,
    theme: 'Général',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRegistration(overrides: Partial<EventRegistration> = {}): EventRegistration {
  return {
    id: 'reg-1',
    userId: 'user-1',
    eventId: 'event-1',
    occurrenceDate: new Date('2026-04-07T09:00:00Z'),
    cancelledAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('calendar – generateOccurrences', () => {
  const rangeStart = new Date('2026-04-01T00:00:00Z');
  const rangeEnd = new Date('2026-04-30T23:59:59Z');

  it('retourne un événement unique dans la plage', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent();
    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      rangeStart,
      rangeEnd
    );

    expect(result).toHaveLength(1);
    expect(result[0].event.id).toBe('event-1');
    expect(result[0].date).toEqual(new Date('2026-04-07T09:00:00Z'));
    expect(result[0].registrationCount).toBe(0);
    expect(result[0].isRegistered).toBe(false);
  });

  it('ignore un événement unique hors de la plage', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent({ startTime: new Date('2026-05-15T09:00:00Z') });
    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      rangeStart,
      rangeEnd
    );

    expect(result).toHaveLength(0);
  });

  it('génère les occurrences WEEKLY dans la plage', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'WEEKLY',
      startTime: new Date('2026-04-07T09:00:00Z'),
      recurrenceEnd: null,
    });

    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      rangeStart,
      rangeEnd
    );

    // April 7, 14, 21, 28
    expect(result).toHaveLength(4);
    expect(result[0].date).toEqual(new Date('2026-04-07T09:00:00Z'));
    expect(result[1].date).toEqual(new Date('2026-04-14T09:00:00Z'));
    expect(result[2].date).toEqual(new Date('2026-04-21T09:00:00Z'));
    expect(result[3].date).toEqual(new Date('2026-04-28T09:00:00Z'));
  });

  it('génère les occurrences DAILY dans la plage', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'DAILY',
      startTime: new Date('2026-04-01T10:00:00Z'),
      recurrenceEnd: new Date('2026-04-05T10:00:00Z'),
    });

    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      rangeStart,
      rangeEnd
    );

    // April 1, 2, 3, 4, 5
    expect(result).toHaveLength(5);
  });

  it('génère les occurrences MONTHLY', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'MONTHLY',
      startTime: new Date('2026-01-15T09:00:00Z'),
      recurrenceEnd: null,
    });

    const bigRangeStart = new Date('2026-01-01T00:00:00Z');
    const bigRangeEnd = new Date('2026-06-30T23:59:59Z');

    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      bigRangeStart,
      bigRangeEnd
    );

    // Jan 15, Feb 15, Mar 15, Apr 15, May 15, Jun 15
    expect(result).toHaveLength(6);
  });

  it('respecte la date de fin de récurrence', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'WEEKLY',
      startTime: new Date('2026-04-07T09:00:00Z'),
      recurrenceEnd: new Date('2026-04-20T23:59:59Z'),
    });

    const result = generateOccurrences(
      [{ ...event, registrations: [] }],
      rangeStart,
      rangeEnd
    );

    // April 7, 14 (21 is after recurrenceEnd)
    expect(result).toHaveLength(2);
  });

  it('calcule registrationCount correctement', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent();
    const registrations = [
      makeRegistration({ id: 'r1', userId: 'user-1' }),
      makeRegistration({ id: 'r2', userId: 'user-2' }),
      makeRegistration({ id: 'r3', userId: 'user-3', cancelledAt: new Date() }),
    ];

    const result = generateOccurrences(
      [{ ...event, registrations }],
      rangeStart,
      rangeEnd
    );

    expect(result).toHaveLength(1);
    // 2 active (user-3 is cancelled)
    expect(result[0].registrationCount).toBe(2);
  });

  it('détecte isRegistered pour un userId', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent();
    const registrations = [
      makeRegistration({ userId: 'user-1' }),
    ];

    const result = generateOccurrences(
      [{ ...event, registrations }],
      rangeStart,
      rangeEnd,
      'user-1'
    );

    expect(result[0].isRegistered).toBe(true);
    expect(result[0].isCancelled).toBe(false);
  });

  it('détecte isCancelled pour un userId', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event = makeEvent();
    const registrations = [
      makeRegistration({ userId: 'user-1', cancelledAt: new Date() }),
    ];

    const result = generateOccurrences(
      [{ ...event, registrations }],
      rangeStart,
      rangeEnd,
      'user-1'
    );

    expect(result[0].isRegistered).toBe(false);
    expect(result[0].isCancelled).toBe(true);
  });

  it('trie les occurrences par date', async () => {
    const { generateOccurrences } = await import('@/lib/calendar');

    const event1 = makeEvent({
      id: 'ev-late',
      startTime: new Date('2026-04-20T09:00:00Z'),
    });
    const event2 = makeEvent({
      id: 'ev-early',
      startTime: new Date('2026-04-05T09:00:00Z'),
    });

    const result = generateOccurrences(
      [
        { ...event1, registrations: [] },
        { ...event2, registrations: [] },
      ],
      rangeStart,
      rangeEnd
    );

    expect(result[0].event.id).toBe('ev-early');
    expect(result[1].event.id).toBe('ev-late');
  });
});

describe('calendar – isValidOccurrence', () => {
  it('valide une date exacte pour un événement unique', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({ startTime: new Date('2026-04-07T09:00:00Z') });
    expect(isValidOccurrence(event, new Date('2026-04-07T09:00:00Z'))).toBe(true);
  });

  it('refuse une date différente pour un événement unique', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({ startTime: new Date('2026-04-07T09:00:00Z') });
    expect(isValidOccurrence(event, new Date('2026-04-08T09:00:00Z'))).toBe(false);
  });

  it('refuse une date avant le début', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'WEEKLY',
      startTime: new Date('2026-04-07T09:00:00Z'),
    });
    expect(isValidOccurrence(event, new Date('2026-03-31T09:00:00Z'))).toBe(false);
  });

  it('refuse une date après la fin de récurrence', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'WEEKLY',
      startTime: new Date('2026-04-07T09:00:00Z'),
      recurrenceEnd: new Date('2026-04-20T23:59:59Z'),
    });
    expect(isValidOccurrence(event, new Date('2026-04-28T09:00:00Z'))).toBe(false);
  });

  it('valide une occurrence DAILY', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'DAILY',
      startTime: new Date('2026-04-01T10:00:00Z'),
    });
    expect(isValidOccurrence(event, new Date('2026-04-05T10:00:00Z'))).toBe(true);
    expect(isValidOccurrence(event, new Date('2026-04-05T11:00:00Z'))).toBe(false);
  });

  it('valide une occurrence WEEKLY', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'WEEKLY',
      startTime: new Date('2026-04-07T09:00:00Z'),
    });
    // 7 days later
    expect(isValidOccurrence(event, new Date('2026-04-14T09:00:00Z'))).toBe(true);
    // 3 days later (not on schedule)
    expect(isValidOccurrence(event, new Date('2026-04-10T09:00:00Z'))).toBe(false);
  });

  it('valide une occurrence MONTHLY', async () => {
    const { isValidOccurrence } = await import('@/lib/calendar');

    const event = makeEvent({
      recurrence: 'MONTHLY',
      startTime: new Date('2026-01-15T09:00:00Z'),
    });
    expect(isValidOccurrence(event, new Date('2026-04-15T09:00:00Z'))).toBe(true);
    expect(isValidOccurrence(event, new Date('2026-04-16T09:00:00Z'))).toBe(false);
  });
});

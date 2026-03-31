import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/notifications'), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

describe('PUT /api/auth/notifications', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { PUT } = await import('@/app/api/auth/notifications/route');
    const res = await PUT(createRequest({ notifNewCourses: true }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si notifNewCourses manquant', async () => {
    const { PUT } = await import('@/app/api/auth/notifications/route');
    const res = await PUT(createRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('invalides');
  });

  it('retourne 400 si notifNewCourses n\'est pas un booléen', async () => {
    const { PUT } = await import('@/app/api/auth/notifications/route');
    const res = await PUT(createRequest({ notifNewCourses: 'oui' }));
    expect(res.status).toBe(400);
  });

  it('active les notifications', async () => {
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/notifications/route');
    const res = await PUT(createRequest({ notifNewCourses: true }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { notifNewCourses: true },
    });
  });

  it('désactive les notifications', async () => {
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/notifications/route');
    const res = await PUT(createRequest({ notifNewCourses: false }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { notifNewCourses: false },
    });
  });
});

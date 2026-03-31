import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock access helper
const canAccessFormationMock = vi.fn();
vi.mock('@/lib/helpers/access', () => ({
  canAccessFormation: (...args: unknown[]) => canAccessFormationMock(...args),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/formations/progress'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/formations/progress', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    canAccessFormationMock.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si formationVideoId manquant', async () => {
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ progress: 50 }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si progress manquant', async () => {
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1' }));
    expect(res.status).toBe(400);
  });

  it('retourne 403 si user n\'a pas accès à la formation', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(false);
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));
    expect(res.status).toBe(403);
  });

  it('retourne 200 si user a accès (user normal)', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ id: 'p-1' });
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));
    expect(res.status).toBe(200);
  });

  it('retourne 200 pour un admin même sans achat', async () => {
    setSession({ ...mockSession, user: { ...mockSession.user, role: 'ADMIN' } });
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ id: 'p-2' });
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-2', progress: 100 }));
    expect(res.status).toBe(200);
  });

  it('retourne 403 pour un guest (non authentifié)', async () => {
    setSession(null);
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-3', progress: 10 }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si progress manquant', async () => {
    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1' }));
    expect(res.status).toBe(400);
  });

  it('retourne 404 si la vidéo de formation n\'existe pas', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-unknown', progress: 50 }));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si pas d\'accès à la formation', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(false);

    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));
    expect(res.status).toBe(403);
  });

  it('crée/met à jour la progression', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);

    const mockResult = { id: 'fp-1', userId: 'user-1', formationVideoId: 'v-1', progress: 50, completed: false };
    prismaMock.formationVideoProgress.upsert.mockResolvedValue(mockResult);

    const { POST } = await import('@/app/api/formations/progress/route');
    const res = await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.progress).toBe(50);
    expect(prismaMock.formationVideoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_formationVideoId: { userId: 'user-1', formationVideoId: 'v-1' },
        },
        update: expect.objectContaining({ progress: 50, completed: false }),
        create: expect.objectContaining({ progress: 50, completed: false }),
      })
    );
  });

  it('clamp la progression entre 0 et 100', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ progress: 100, completed: true });

    const { POST } = await import('@/app/api/formations/progress/route');
    await POST(createRequest({ formationVideoId: 'v-1', progress: 200 }));

    expect(prismaMock.formationVideoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ progress: 100 }),
        create: expect.objectContaining({ progress: 100 }),
      })
    );
  });

  it('auto-complète si progress >= 95', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ progress: 96, completed: true });

    const { POST } = await import('@/app/api/formations/progress/route');
    await POST(createRequest({ formationVideoId: 'v-1', progress: 96 }));

    expect(prismaMock.formationVideoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ completed: true }),
        create: expect.objectContaining({ completed: true }),
      })
    );
  });

  it('ne marque pas comme complété si progress < 95', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ progress: 50, completed: false });

    const { POST } = await import('@/app/api/formations/progress/route');
    await POST(createRequest({ formationVideoId: 'v-1', progress: 50 }));

    expect(prismaMock.formationVideoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ completed: false }),
        create: expect.objectContaining({ completed: false }),
      })
    );
  });

  it('accepte un override completed=true même si progress < 95', async () => {
    prismaMock.formationVideo.findUnique.mockResolvedValue({ formationId: 'f-1' });
    canAccessFormationMock.mockResolvedValue(true);
    prismaMock.formationVideoProgress.upsert.mockResolvedValue({ progress: 10, completed: true });

    const { POST } = await import('@/app/api/formations/progress/route');
    await POST(createRequest({ formationVideoId: 'v-1', progress: 10, completed: true }));

    expect(prismaMock.formationVideoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ completed: true }),
        create: expect.objectContaining({ completed: true }),
      })
    );
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PUT /api/auth/profile', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({ name: 'New Name' }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si nom manquant', async () => {
    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('requis');
  });

  it('retourne 400 si nom vide', async () => {
    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({ name: '' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si nom est juste des espaces', async () => {
    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({ name: '   ' }));
    expect(res.status).toBe(400);
  });

  it('met à jour le nom avec succès', async () => {
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({ name: 'Nouveau Nom' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Nouveau Nom' },
    });
  });

  it('trim le nom avant de sauvegarder', async () => {
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/profile/route');
    await PUT(createRequest({ name: '  Nom avec espaces  ' }));

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Nom avec espaces' },
    });
  });

  it('rejette si name n\'est pas une chaîne', async () => {
    const { PUT } = await import('@/app/api/auth/profile/route');
    const res = await PUT(createRequest({ name: 12345 }));
    expect(res.status).toBe(400);
  });
});

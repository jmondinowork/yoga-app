import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock bcrypt
const bcryptMock = {
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('$2a$12$newhash'),
};
vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/password'), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

describe('PUT /api/auth/password', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    bcryptMock.compare.mockReset();
    bcryptMock.hash.mockReset().mockResolvedValue('$2a$12$newhash');
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'old', newPassword: 'NewP@ssword12' }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si mot de passe actuel manquant', async () => {
    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ newPassword: 'NewP@ssword12' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si nouveau mot de passe manquant', async () => {
    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'old' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si nouveau mot de passe ne respecte pas la politique', async () => {
    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'old', newPassword: 'Short1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('12 caractères');
  });

  it('retourne 400 si utilisateur n\'a pas de mot de passe (OAuth)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: null });

    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'old', newPassword: 'NewP@ssword12' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Aucun mot de passe');
  });

  it('retourne 403 si mot de passe actuel incorrect', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$oldhash' });
    bcryptMock.compare.mockResolvedValue(false);

    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'wrong', newPassword: 'NewP@ssword12' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('incorrect');
  });

  it('change le mot de passe avec succès', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$oldhash' });
    bcryptMock.compare.mockResolvedValue(true);
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/password/route');
    const res = await PUT(createRequest({ currentPassword: 'old', newPassword: 'NewP@ssword12' }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: '$2a$12$newhash' },
    });
  });

  it('hash le mot de passe avec bcrypt (12 rounds)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$oldhash' });
    bcryptMock.compare.mockResolvedValue(true);
    prismaMock.user.update.mockResolvedValue({});

    const { PUT } = await import('@/app/api/auth/password/route');
    await PUT(createRequest({ currentPassword: 'old', newPassword: 'NewP@ssword12' }));

    expect(bcryptMock.hash).toHaveBeenCalledWith('NewP@ssword12', 12);
  });
});

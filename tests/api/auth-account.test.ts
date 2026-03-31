import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock bcrypt
const bcryptMock = {
  compare: vi.fn(),
  hash: vi.fn(),
};
vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/account'), {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}

describe('DELETE /api/auth/account', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    bcryptMock.compare.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { DELETE } = await import('@/app/api/auth/account/route');
    const res = await DELETE(createRequest({ password: 'pass' }));
    expect(res.status).toBe(401);
  });

  it('retourne 400 si mot de passe non fourni', async () => {
    const { DELETE } = await import('@/app/api/auth/account/route');
    const res = await DELETE(createRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('requis');
  });
});

describe('DELETE /api/auth/account (suite)', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    bcryptMock.compare.mockReset();
  });

  it('retourne 400 si utilisateur sans mot de passe (OAuth)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: null });

    const { DELETE } = await import('@/app/api/auth/account/route');
    const res = await DELETE(createRequest({ password: 'pass' }));
    expect(res.status).toBe(400);
  });

  it('retourne 403 si mot de passe incorrect', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$hash' });
    bcryptMock.compare.mockResolvedValue(false);

    const { DELETE } = await import('@/app/api/auth/account/route');
    const res = await DELETE(createRequest({ password: 'wrong' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('incorrect');
  });

  it('supprime le compte avec succès', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$hash' });
    bcryptMock.compare.mockResolvedValue(true);
    prismaMock.user.delete.mockResolvedValue({});

    const { DELETE } = await import('@/app/api/auth/account/route');
    const res = await DELETE(createRequest({ password: 'correct' }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });
});

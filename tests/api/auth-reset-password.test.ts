import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

// Mock bcrypt
const bcryptMock = {
  hash: vi.fn().mockResolvedValue('$2a$12$newhash'),
};
vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 900000 })),
  rateLimitResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/reset-password'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-forwarded-for': '127.0.0.1' },
  });
}

const VALID_PASSWORD = 'Secure@Password1';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    resetPrismaMock();
    bcryptMock.hash.mockReset().mockResolvedValue('$2a$12$newhash');
  });

  it('retourne 400 si le token est manquant', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(createRequest({ password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Token');
  });

  it('retourne 400 si le mot de passe ne respecte pas la politique', async () => {
    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(createRequest({ token: 'sometoken', password: 'tooshort' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('12 caractères');
  });

  it('retourne 400 si le token est invalide ou expiré', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(createRequest({ token: 'invalidtoken', password: VALID_PASSWORD }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('invalide ou expiré');
  });

  it('réinitialise le mot de passe et supprime le token si tout est valide', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(createRequest({ token: 'validtoken123', password: VALID_PASSWORD }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Vérifie que le mot de passe est hashé
    expect(bcryptMock.hash).toHaveBeenCalledWith(VALID_PASSWORD, 12);

    // Vérifie que le token est supprimé après utilisation
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          password: '$2a$12$newhash',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        }),
      })
    );
  });

  it('recherche le token via son hash SHA-256', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/reset-password/route');
    await POST(createRequest({ token: 'myrawtoken', password: VALID_PASSWORD }));

    const { createHash } = await import('crypto');
    const expectedHash = createHash('sha256').update('myrawtoken').digest('hex');

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          resetPasswordToken: expectedHash,
        }),
      })
    );
  });

  it('retourne 429 si le rate limit est dépassé', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 900000 });

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const res = await POST(createRequest({ token: 'sometoken', password: VALID_PASSWORD }));
    expect(res.status).toBe(429);
  });

  it('accepte tous les mots de passe valides (politique 12 chars)', async () => {
    const validPasswords = [
      'Secure@Password1',
      'My$tr0ngPassw0rd!',
      'Test123!@#ABCdef',
    ];

    for (const pwd of validPasswords) {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.user.update.mockResolvedValue({ id: 'user-1' });

      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(createRequest({ token: 'validtoken', password: pwd }));
      expect(res.status).toBe(200);
    }
  });

  it('rejette les mots de passe trop faibles', async () => {
    const weakPasswords = [
      'short',
      'alllowercase123!',
      'ALLUPPERCASE123!',
      'NoSpecialChar123',
      'NoDigitHere!@#A',
    ];

    for (const pwd of weakPasswords) {
      const { POST } = await import('@/app/api/auth/reset-password/route');
      const res = await POST(createRequest({ token: 'sometoken', password: pwd }));
      expect(res.status).toBe(400);
    }
  });
});

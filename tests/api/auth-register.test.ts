import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: vi.fn(),
  },
}));

// Mock resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-123' }),
    },
  })),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 900000 })),
  rateLimitResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/register'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-forwarded-for': '127.0.0.1' },
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it('retourne 400 si email manquant', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ password: 'StrongP@ss123!' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe manquant', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe trop court (< 12 caractères)', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com', password: 'Short1!' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('12 caractères');
  });

  it('retourne 400 si mot de passe sans majuscule', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com', password: 'nouppercase123!' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe sans chiffre', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com', password: 'NoDigitsHere!!' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe sans caractère spécial', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com', password: 'NoSpecialChar12' }));
    expect(res.status).toBe(400);
  });

  it('retourne 409 si email déjà utilisé', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'test@test.com' });

    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({ email: 'test@test.com', password: 'ValidP@ssw0rd!' }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('existe déjà');
  });

  it('crée un utilisateur avec un mot de passe valide', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.verificationToken.create.mockResolvedValue({});
    prismaMock.user.create.mockResolvedValue({ id: 'new-user', email: 'new@test.com' });

    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({
      name: 'Test User',
      email: 'new@test.com',
      password: 'ValidP@ssw0rd!',
    }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.needsVerification).toBe(true);
  });

  it('crée un token de vérification email valide 24h', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.verificationToken.create.mockResolvedValue({});
    prismaMock.user.create.mockResolvedValue({ id: 'new-user' });

    const { POST } = await import('@/app/api/auth/register/route');
    await POST(createRequest({
      email: 'new@test.com',
      password: 'ValidP@ssw0rd!',
    }));

    expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        identifier: 'new@test.com',
        token: expect.any(String),
        expires: expect.any(Date),
      }),
    });

    // Token expire dans ~24h
    const callArgs = prismaMock.verificationToken.create.mock.calls[0][0].data;
    const hoursFromNow = (callArgs.expires.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(hoursFromNow).toBeCloseTo(24, 0);
  });

  it('crée le user avec emailVerified=null (non vérifié)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.verificationToken.create.mockResolvedValue({});
    prismaMock.user.create.mockResolvedValue({ id: 'new-user' });

    const { POST } = await import('@/app/api/auth/register/route');
    await POST(createRequest({
      email: 'new@test.com',
      password: 'ValidP@ssw0rd!',
    }));

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'new@test.com',
        emailVerified: null,
        password: expect.any(String),
      }),
    });
  });

  it('rate limit après 5 inscriptions par IP', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    (rateLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 900000 });

    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(createRequest({
      email: 'new@test.com',
      password: 'ValidP@ssw0rd!',
    }));

    // rateLimitResponse is called which returns 429
    expect(res.status).toBe(429);
  });
});

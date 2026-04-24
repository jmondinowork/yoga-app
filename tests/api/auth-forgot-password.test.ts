import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

// Mock email
const sendResetPasswordEmailMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email', () => ({
  sendResetPasswordEmail: sendResetPasswordEmailMock,
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 2, resetAt: Date.now() + 900000 })),
  rateLimitResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/forgot-password'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-forwarded-for': '127.0.0.1' },
  });
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    resetPrismaMock();
    sendResetPasswordEmailMock.mockReset().mockResolvedValue(undefined);
  });

  it('retourne 400 si email manquant', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Email');
  });

  it('retourne 200 même si le compte n\'existe pas (anti-énumération)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const res = await POST(createRequest({ email: 'inconnu@test.com' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(sendResetPasswordEmailMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('retourne 200 si le compte existe sans mot de passe (OAuth uniquement)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', password: null });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const res = await POST(createRequest({ email: 'oauth@test.com' }));
    expect(res.status).toBe(200);
    expect(sendResetPasswordEmailMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('génère un token, l\'enregistre en base et envoie l\'email si l\'utilisateur existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', password: '$2a$12$hash' });
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const res = await POST(createRequest({ email: 'user@test.com' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Vérifie que le token hashé est enregistré en base
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        }),
      })
    );

    // Vérifie que l'email est envoyé avec l'URL contenant le token brut (non hashé)
    expect(sendResetPasswordEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@test.com',
        resetUrl: expect.stringContaining('/reinitialiser-mot-de-passe?token='),
      })
    );
  });

  it('normalise l\'email en minuscules', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    await POST(createRequest({ email: 'User@TEST.COM' }));

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'user@test.com' } })
    );
  });

  it('le token stocké en base est différent du token dans l\'URL (hash SHA-256)', async () => {
    let capturedUpdateData: Record<string, unknown> | null = null;
    let capturedEmailData: { email: string; resetUrl: string } | null = null;

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', password: '$2a$12$hash' });
    prismaMock.user.update.mockImplementation((args: { data: Record<string, unknown> }) => {
      capturedUpdateData = args.data;
      return Promise.resolve({ id: 'user-1' });
    });
    sendResetPasswordEmailMock.mockImplementation((opts: { email: string; resetUrl: string }) => {
      capturedEmailData = opts;
      return Promise.resolve();
    });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    await POST(createRequest({ email: 'user@test.com' }));

    // Extraire le token brut depuis l'URL de l'email
    const rawToken = capturedEmailData!.resetUrl.split('token=')[1];
    const storedToken = capturedUpdateData!.resetPasswordToken as string;

    // Le token dans l'URL ne doit PAS être le token stocké en base
    expect(rawToken).not.toBe(storedToken);
    // Le token stocké doit être le SHA-256 du token brut
    const { createHash } = await import('crypto');
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');
    expect(storedToken).toBe(expectedHash);
  });

  it('retourne 429 si le rate limit est dépassé', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 900000 });

    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const res = await POST(createRequest({ email: 'user@test.com' }));
    expect(res.status).toBe(429);
  });
});

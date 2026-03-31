import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

// Mock bcrypt
const bcryptMock = {
  hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: vi.fn(),
};
vi.mock('bcryptjs', () => ({
  default: bcryptMock,
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/auth/invitation'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/invitation', () => {
  beforeEach(() => {
    resetPrismaMock();
    bcryptMock.hash.mockReset().mockResolvedValue('$2a$12$hashedpassword');
  });

  it('retourne 400 si token manquant', async () => {
    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ password: 'ValidP@ss123' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Token requis');
  });

  it('retourne 400 si token n\'est pas une chaîne', async () => {
    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ token: 123, password: 'ValidP@ss123' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe manquant', async () => {
    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ token: 'valid-token' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('12 caractères');
  });

  it('retourne 400 si mot de passe ne respecte pas la politique', async () => {
    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ token: 'valid-token', password: 'Short1' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('12 caractères');
  });

  it('retourne 400 si token invalide ou expiré', async () => {
    // $transaction mock retourne null (user non trouvé)
    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      // Simuler : findFirst retourne null (token invalide)
      const mockTx = {
        ...prismaMock,
        user: {
          ...prismaMock.user,
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };
      return fn(mockTx);
    });

    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ token: 'expired-token', password: 'ValidP@ss123' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('invalide ou expiré');
  });

  it('active le compte avec un token valide', async () => {
    const updatedUser = {
      id: 'u1',
      email: 'invited@test.com',
      invitationToken: null,
      invitationExpires: null,
      password: '$2a$12$hashedpassword',
      emailVerified: expect.any(Date),
    };

    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        ...prismaMock,
        user: {
          ...prismaMock.user,
          findFirst: vi.fn().mockResolvedValue({
            id: 'u1',
            invitationToken: 'valid-token',
            invitationExpires: new Date(Date.now() + 3600000),
          }),
          update: vi.fn().mockResolvedValue(updatedUser),
        },
      };
      return fn(mockTx);
    });

    const { POST } = await import('@/app/api/auth/invitation/route');
    const res = await POST(createRequest({ token: 'valid-token', password: 'ValidP@ss123' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('hash le mot de passe avec bcrypt (12 rounds)', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        ...prismaMock,
        user: {
          ...prismaMock.user,
          findFirst: vi.fn().mockResolvedValue({
            id: 'u1',
            invitationToken: 'valid-token',
            invitationExpires: new Date(Date.now() + 3600000),
          }),
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(mockTx);
    });

    const { POST } = await import('@/app/api/auth/invitation/route');
    await POST(createRequest({ token: 'valid-token', password: 'SecureP@ss12' }));

    expect(bcryptMock.hash).toHaveBeenCalledWith('SecureP@ss12', 12);
  });
});

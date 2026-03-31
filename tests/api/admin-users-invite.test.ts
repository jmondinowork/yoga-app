import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock email
vi.mock('@/lib/email', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/admin/users/invite'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/users/invite', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  it('retourne 403 si non admin', async () => {
    setSession(mockSession);
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'new@test.com', role: 'USER' }));
    expect(res.status).toBe(403);
  });

  it('retourne 403 si non connecté', async () => {
    setSession(null);
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'new@test.com', role: 'USER' }));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si email manquant', async () => {
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ role: 'USER' }));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si format email invalide', async () => {
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'pas-un-email', role: 'USER' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('email invalide');
  });

  it('retourne 400 si rôle invalide', async () => {
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'test@test.com', role: 'SUPERADMIN' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Rôle invalide');
  });

  it('retourne 400 si rôle manquant', async () => {
    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'test@test.com' }));
    expect(res.status).toBe(400);
  });

  it('retourne 409 si utilisateur déjà activé (a un mot de passe)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'existing@test.com', password: '$2a$12$hash',
    });

    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({ email: 'existing@test.com', role: 'USER' }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toContain('existe déjà');
  });

  it('ré-envoie une invitation si utilisateur existe sans mot de passe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'pending@test.com', name: 'Pending', password: null,
    });
    prismaMock.user.update.mockResolvedValue({});

    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({
      email: 'pending@test.com', name: 'Updated Name', role: 'ADMIN',
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          role: 'ADMIN',
          invitationToken: expect.any(String),
          invitationExpires: expect.any(Date),
        }),
      })
    );
  });

  it('crée un nouvel utilisateur avec invitation', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'new-user' });

    const { POST } = await import('@/app/api/admin/users/invite/route');
    const res = await POST(createRequest({
      email: 'NEW@Test.com', name: 'Nouveau', role: 'USER',
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'new@test.com', // normalisé en minuscule
        name: 'Nouveau',
        role: 'USER',
        invitationToken: expect.any(String),
        invitationExpires: expect.any(Date),
      }),
    });

    // Vérifie que le token expire dans ~48h
    const callArgs = prismaMock.user.create.mock.calls[0][0].data;
    const hoursFromNow = (callArgs.invitationExpires.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(hoursFromNow).toBeCloseTo(48, 0);
  });

  it('envoie un email d\'invitation', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'new' });

    const { sendInvitationEmail } = await import('@/lib/email');

    const { POST } = await import('@/app/api/admin/users/invite/route');
    await POST(createRequest({ email: 'test@test.com', name: 'Test', role: 'USER' }));

    expect(sendInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        name: 'Test',
        role: 'USER',
        invitationUrl: expect.stringContaining('/invitation?token='),
      })
    );
  });

  it('tronque le nom à 100 caractères', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'new' });

    const longName = 'A'.repeat(200);

    const { POST } = await import('@/app/api/admin/users/invite/route');
    await POST(createRequest({ email: 'test@test.com', name: longName, role: 'USER' }));

    const callArgs = prismaMock.user.create.mock.calls[0][0].data;
    expect(callArgs.name.length).toBeLessThanOrEqual(100);
  });
});

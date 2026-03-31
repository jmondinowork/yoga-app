import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: false,
  getStripe: vi.fn(() => ({
    subscriptions: { cancel: vi.fn().mockResolvedValue({}) },
  })),
}));

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('Admin API /api/admin/users', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  // ─── GET ───
  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);
      const { GET } = await import('@/app/api/admin/users/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/users'));
      expect(res.status).toBe(403);
    });

    it('retourne 403 si non connecté', async () => {
      setSession(null);
      const { GET } = await import('@/app/api/admin/users/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/users'));
      expect(res.status).toBe(403);
    });

    it('retourne la liste des utilisateurs', async () => {
      const users = [
        { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'USER', createdAt: new Date(), subscription: null, _count: { purchases: 0 } },
        { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'ADMIN', createdAt: new Date(), subscription: { plan: 'MONTHLY', status: 'ACTIVE' }, _count: { purchases: 2 } },
      ];
      prismaMock.user.findMany.mockResolvedValue(users);

      const { GET } = await import('@/app/api/admin/users/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/users'));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.users).toHaveLength(2);
      expect(json.total).toBe(2);
    });

    it('filtre par recherche (nom ou email)', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/admin/users/route');
      await GET(createRequest('http://localhost:3000/api/admin/users?search=alice'));

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'alice', mode: 'insensitive' } },
              { email: { contains: 'alice', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('filtre par abonnement actif', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/admin/users/route');
      await GET(createRequest('http://localhost:3000/api/admin/users?filter=subscribed'));

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscription: { status: 'ACTIVE' },
          }),
        })
      );
    });

    it('filtre par utilisateurs sans abonnement', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/admin/users/route');
      await GET(createRequest('http://localhost:3000/api/admin/users?filter=free'));

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subscription: null,
          }),
        })
      );
    });
  });

  // ─── PATCH (rôle) ───
  describe('PATCH', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);
      const { PATCH } = await import('@/app/api/admin/users/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'u1', role: 'ADMIN' }),
      }));
      expect(res.status).toBe(403);
    });

    it('retourne 400 si données invalides', async () => {
      const { PATCH } = await import('@/app/api/admin/users/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'u1', role: 'SUPERADMIN' }),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si userId manquant', async () => {
      const { PATCH } = await import('@/app/api/admin/users/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'ADMIN' }),
      }));
      expect(res.status).toBe(400);
    });

    it('empêche un admin de retirer son propre rôle', async () => {
      const { PATCH } = await import('@/app/api/admin/users/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'admin-1', role: 'USER' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('propre rôle');
    });

    it('modifie le rôle d\'un autre utilisateur', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'ADMIN',
      });

      const { PATCH } = await import('@/app/api/admin/users/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'u1', role: 'ADMIN' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.role).toBe('ADMIN');
    });
  });

  // ─── DELETE ───
  describe('DELETE', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);
      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'u1' }),
      }));
      expect(res.status).toBe(403);
    });

    it('retourne 400 si userId manquant', async () => {
      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({}),
      }));
      expect(res.status).toBe(400);
    });

    it('empêche l\'admin de se supprimer lui-même', async () => {
      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'admin-1' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('propre compte');
    });

    it('retourne 404 si utilisateur introuvable', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'nonexistent' }),
      }));
      expect(res.status).toBe(404);
    });

    it('supprime un utilisateur sans abonnement', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1', subscription: null,
      });
      prismaMock.user.delete.mockResolvedValue({});

      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'u1' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('résilie l\'abonnement Stripe avant de supprimer', async () => {
      const { getStripe } = await import('@/lib/stripe');
      const mockCancel = vi.fn().mockResolvedValue({});
      (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
        subscriptions: { cancel: mockCancel },
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        subscription: { stripeSubscriptionId: 'sub_xyz' },
      });
      prismaMock.user.delete.mockResolvedValue({});

      const { DELETE } = await import('@/app/api/admin/users/route');
      const res = await DELETE(createRequest('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'u1' }),
      }));

      expect(res.status).toBe(200);
      expect(mockCancel).toHaveBeenCalledWith('sub_xyz');
    });
  });
});

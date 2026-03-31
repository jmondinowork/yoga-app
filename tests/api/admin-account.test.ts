import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';
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
  return new NextRequest(new URL('http://localhost:3000/api/admin/account'), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

describe('Admin API /api/admin/account', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
    bcryptMock.compare.mockReset();
    bcryptMock.hash.mockReset().mockResolvedValue('$2a$12$newhash');
  });

  // ─── GET ───
  describe('GET', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { GET } = await import('@/app/api/admin/account/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('retourne 401 si non connecté', async () => {
      setSession(null);
      const { GET } = await import('@/app/api/admin/account/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('retourne 404 si admin introuvable en base', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/admin/account/route');
      const res = await GET();
      expect(res.status).toBe(404);
    });

    it('retourne les informations du compte admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'admin-1', name: 'Admin', email: 'admin@yogaflow.fr',
      });

      const { GET } = await import('@/app/api/admin/account/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.name).toBe('Admin');
      expect(json.email).toBe('admin@yogaflow.fr');
    });
  });

  // ─── PATCH (nom) ───
  describe('PATCH - Mise à jour du nom', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({ name: 'New Name' }));
      expect(res.status).toBe(401);
    });

    it('retourne 400 si nom trop court (< 2 chars)', async () => {
      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({ name: 'A' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('2 caractères');
    });

    it('met à jour le nom avec succès', async () => {
      prismaMock.user.update.mockResolvedValue({});

      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({ name: 'Mathilde Torrez' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { name: 'Mathilde Torrez' },
      });
    });
  });

  // ─── PATCH (mot de passe) ───
  describe('PATCH - Changement de mot de passe', () => {
    it('retourne 400 si admin sans mot de passe (OAuth)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: null });

      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({
        currentPassword: 'old', newPassword: 'NewP@ssword12',
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si mot de passe actuel incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$hash' });
      bcryptMock.compare.mockResolvedValue(false);

      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({
        currentPassword: 'wrong', newPassword: 'NewP@ssword12',
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('incorrect');
    });

    it('retourne 400 si nouveau mot de passe ne respecte pas la politique', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$hash' });
      bcryptMock.compare.mockResolvedValue(true);

      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({
        currentPassword: 'old', newPassword: 'Short1',
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('12 caractères');
    });

    it('change le mot de passe avec succès', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: '$2a$12$hash' });
      bcryptMock.compare.mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({});

      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({
        currentPassword: 'OldPassword', newPassword: 'NewP@ssword12',
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('Mot de passe');
      expect(bcryptMock.hash).toHaveBeenCalledWith('NewP@ssword12', 12);
    });
  });

  // ─── PATCH (données manquantes) ───
  describe('PATCH - Données manquantes', () => {
    it('retourne 400 si ni nom ni mot de passe fourni', async () => {
      const { PATCH } = await import('@/app/api/admin/account/route');
      const res = await PATCH(createRequest({}));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('manquantes');
    });
  });
});

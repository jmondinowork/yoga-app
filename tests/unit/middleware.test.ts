import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock next-auth/jwt
const getTokenMock = vi.fn();
vi.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => getTokenMock(...args),
}));

import { NextRequest } from 'next/server';

function createRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('Middleware', () => {
  beforeEach(() => {
    getTokenMock.mockReset();
  });

  // ─── Routes protégées (Dashboard) ───
  describe('Routes protégées /mon-espace', () => {
    it('redirige vers /connexion si non connecté', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/mon-espace'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/connexion');
      expect(res.headers.get('location')).toContain('callbackUrl=%2Fmon-espace');
    });

    it('redirige vers /connexion pour /mon-espace/parametres si non connecté', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/mon-espace/parametres'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/connexion');
    });

    it('laisse passer un utilisateur connecté', async () => {
      getTokenMock.mockResolvedValue({ id: 'u1', role: 'USER' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/mon-espace'));

      // Pas de redirection = NextResponse.next()
      expect(res.status).toBe(200);
    });
  });

  // ─── Routes admin ───
  describe('Routes admin /admin', () => {
    it('redirige vers /connexion si non connecté', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/admin'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/connexion');
    });

    it('redirige vers / si connecté mais pas admin', async () => {
      getTokenMock.mockResolvedValue({ id: 'u1', role: 'USER' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/admin'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('laisse passer un admin', async () => {
      getTokenMock.mockResolvedValue({ id: 'a1', role: 'ADMIN' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/admin'));

      expect(res.status).toBe(200);
    });

    it('protège les sous-routes admin aussi', async () => {
      getTokenMock.mockResolvedValue({ id: 'u1', role: 'USER' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/admin/cours'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  // ─── Redirection des pages auth ───
  describe('Pages auth (connexion/inscription)', () => {
    it('redirige un USER connecté vers /mon-espace depuis /connexion', async () => {
      getTokenMock.mockResolvedValue({ id: 'u1', role: 'USER' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/connexion'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/mon-espace');
    });

    it('redirige un ADMIN connecté vers /admin depuis /connexion', async () => {
      getTokenMock.mockResolvedValue({ id: 'a1', role: 'ADMIN' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/connexion'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('redirige un USER connecté vers /mon-espace depuis /inscription', async () => {
      getTokenMock.mockResolvedValue({ id: 'u1', role: 'USER' });

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/inscription'));

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/mon-espace');
    });

    it('laisse passer un visiteur non connecté sur /connexion', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/connexion'));

      expect(res.status).toBe(200);
    });

    it('laisse passer un visiteur non connecté sur /inscription', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/inscription'));

      expect(res.status).toBe(200);
    });
  });

  // ─── Security Headers ───
  describe('Headers de sécurité', () => {
    it('ajoute les headers de sécurité', async () => {
      getTokenMock.mockResolvedValue(null);

      const { middleware } = await import('@/middleware');
      const res = await middleware(createRequest('http://localhost:3000/connexion'));

      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    });
  });
});

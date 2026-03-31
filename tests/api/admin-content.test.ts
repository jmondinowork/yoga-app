import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(body: Record<string, unknown>, method = 'PUT') {
  return new NextRequest(new URL('http://localhost:3000/api/admin/content'), {
    method,
    body: JSON.stringify(body),
  });
}

describe('Admin API /api/admin/content', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  // ─── GET ───
  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);
      const { GET } = await import('@/app/api/admin/content/route');
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('retourne 403 si non connecté', async () => {
      setSession(null);
      const { GET } = await import('@/app/api/admin/content/route');
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('retourne tout le contenu du site', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([
        { key: 'hero_title', value: 'Bienvenue' },
        { key: 'hero_subtitle', value: 'Découvrez le yoga' },
      ]);

      const { GET } = await import('@/app/api/admin/content/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.hero_title).toBe('Bienvenue');
      expect(json.hero_subtitle).toBe('Découvrez le yoga');
    });

    it('retourne un objet vide si aucun contenu', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/admin/content/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(Object.keys(json)).toHaveLength(0);
    });
  });

  // ─── PUT ───
  describe('PUT', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({ entries: { key: 'val' } }));
      expect(res.status).toBe(403);
    });

    it('retourne 400 si entries manquant', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({}));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si entries est un tableau', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(new NextRequest(new URL('http://localhost:3000/api/admin/content'), {
        method: 'PUT',
        body: JSON.stringify({ entries: ['invalid'] }),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si clé contient des caractères spéciaux', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({ entries: { 'clé/invalide': 'value' } }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Clé invalide');
    });

    it('retourne 400 si clé contient des espaces', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({ entries: { 'key with space': 'value' } }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si clé trop longue (> 100 chars)', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const longKey = 'a'.repeat(101);
      const res = await PUT(createRequest({ entries: { [longKey]: 'value' } }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si valeur trop longue (> 10000 chars)', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const longValue = 'x'.repeat(10001);
      const res = await PUT(createRequest({ entries: { valid_key: longValue } }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Valeur invalide');
    });

    it('retourne 400 si valeur n\'est pas une chaîne', async () => {
      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({ entries: { key: 123 } }));
      expect(res.status).toBe(400);
    });

    it('met à jour le contenu en lot avec succès', async () => {
      prismaMock.siteContent.upsert.mockResolvedValue({});
      prismaMock.$transaction.mockResolvedValue([]);

      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({
        entries: {
          hero_title: 'Nouveau titre',
          hero_subtitle: 'Nouveau sous-titre',
        },
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('accepte des clés avec points, tirets et underscores', async () => {
      prismaMock.$transaction.mockResolvedValue([]);

      const { PUT } = await import('@/app/api/admin/content/route');
      const res = await PUT(createRequest({
        entries: {
          'section.hero.title': 'Title',
          'cta-button': 'Cliquez',
          'footer_text': 'Pied de page',
        },
      }));

      expect(res.status).toBe(200);
    });
  });
});

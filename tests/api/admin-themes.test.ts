import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

describe('Admin API /api/admin/themes', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  // ─── GET ───
  describe('GET', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { GET } = await import('@/app/api/admin/themes/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('retourne 401 si non connecté', async () => {
      setSession(null);
      const { GET } = await import('@/app/api/admin/themes/route');
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('retourne les thèmes avec les compteurs de cours', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha', 'Vinyasa']),
      });
      prismaMock.course.findMany.mockResolvedValue([
        { theme: 'Hatha' },
        { theme: 'Vinyasa' },
      ]);
      prismaMock.course.groupBy.mockResolvedValue([
        { theme: 'Hatha', _count: { id: 3 } },
        { theme: 'Vinyasa', _count: { id: 5 } },
      ]);

      const { GET } = await import('@/app/api/admin/themes/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.themes).toHaveLength(2);
      expect(json.themes.find((t: { name: string }) => t.name === 'Hatha').courseCount).toBe(3);
      expect(json.themes.find((t: { name: string }) => t.name === 'Vinyasa').courseCount).toBe(5);
    });

    it('retourne un tableau vide si aucun thème', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue(null);
      prismaMock.course.findMany.mockResolvedValue([]);
      prismaMock.course.groupBy.mockResolvedValue([]);

      const { GET } = await import('@/app/api/admin/themes/route');
      const res = await GET();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.themes).toHaveLength(0);
    });

    it('inclut les thèmes orphelins des cours pas dans SiteContent', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha']),
      });
      prismaMock.course.findMany.mockResolvedValue([
        { theme: 'Hatha' },
        { theme: 'Yin' }, // thème sur un cours mais pas dans SiteContent
      ]);
      prismaMock.course.groupBy.mockResolvedValue([
        { theme: 'Hatha', _count: { id: 1 } },
        { theme: 'Yin', _count: { id: 2 } },
      ]);

      const { GET } = await import('@/app/api/admin/themes/route');
      const res = await GET();
      const json = await res.json();

      expect(json.themes).toHaveLength(2);
      expect(json.themes.map((t: { name: string }) => t.name)).toContain('Yin');
    });
  });

  // ─── POST ───
  describe('POST', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { POST } = await import('@/app/api/admin/themes/route');
      const res = await POST(new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({ name: 'Nouveau' }),
      }));
      expect(res.status).toBe(401);
    });

    it('retourne 400 si nom vide', async () => {
      const { POST } = await import('@/app/api/admin/themes/route');
      const res = await POST(new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si nom manquant', async () => {
      const { POST } = await import('@/app/api/admin/themes/route');
      const res = await POST(new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({}),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si thème dupliqué', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }]);

      const { POST } = await import('@/app/api/admin/themes/route');
      const res = await POST(new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({ name: 'Hatha' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('existe déjà');
    });

    it('crée un nouveau thème avec succès', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }]);
      prismaMock.siteContent.upsert.mockResolvedValue({});

      const { POST } = await import('@/app/api/admin/themes/route');
      const res = await POST(new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({ name: 'Yin Yoga' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.themes).toContain('Yin Yoga');
    });
  });

  // ─── PATCH ───
  describe('PATCH', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { PATCH } = await import('@/app/api/admin/themes/route');
      const res = await PATCH(new Request('http://localhost:3000', {
        method: 'PATCH',
        body: JSON.stringify({ oldName: 'Hatha', newName: 'Power' }),
      }));
      expect(res.status).toBe(401);
    });

    it('retourne 400 si noms manquants', async () => {
      const { PATCH } = await import('@/app/api/admin/themes/route');
      const res = await PATCH(new Request('http://localhost:3000', {
        method: 'PATCH',
        body: JSON.stringify({ oldName: '', newName: '' }),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 404 si thème introuvable', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }]);

      const { PATCH } = await import('@/app/api/admin/themes/route');
      const res = await PATCH(new Request('http://localhost:3000', {
        method: 'PATCH',
        body: JSON.stringify({ oldName: 'Inexistant', newName: 'Nouveau' }),
      }));
      expect(res.status).toBe(404);
    });

    it('retourne 400 si nouveau nom déjà pris', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha', 'Vinyasa']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }, { theme: 'Vinyasa' }]);

      const { PATCH } = await import('@/app/api/admin/themes/route');
      const res = await PATCH(new Request('http://localhost:3000', {
        method: 'PATCH',
        body: JSON.stringify({ oldName: 'Hatha', newName: 'Vinyasa' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('existe déjà');
    });

    it('renomme le thème et met à jour les cours', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha', 'Vinyasa']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }, { theme: 'Vinyasa' }]);
      prismaMock.siteContent.upsert.mockResolvedValue({});
      prismaMock.course.updateMany.mockResolvedValue({ count: 2 });

      const { PATCH } = await import('@/app/api/admin/themes/route');
      const res = await PATCH(new Request('http://localhost:3000', {
        method: 'PATCH',
        body: JSON.stringify({ oldName: 'Hatha', newName: 'Hatha Flow' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaMock.course.updateMany).toHaveBeenCalledWith({
        where: { theme: 'Hatha' },
        data: { theme: 'Hatha Flow' },
      });
    });
  });

  // ─── DELETE ───
  describe('DELETE', () => {
    it('retourne 401 si non admin', async () => {
      setSession(mockSession);
      const { DELETE } = await import('@/app/api/admin/themes/route');
      const res = await DELETE(new Request('http://localhost:3000', {
        method: 'DELETE',
        body: JSON.stringify({ name: 'Hatha' }),
      }));
      expect(res.status).toBe(401);
    });

    it('retourne 400 si nom vide', async () => {
      const { DELETE } = await import('@/app/api/admin/themes/route');
      const res = await DELETE(new Request('http://localhost:3000', {
        method: 'DELETE',
        body: JSON.stringify({ name: '' }),
      }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si des cours utilisent encore ce thème', async () => {
      prismaMock.course.count.mockResolvedValue(3);

      const { DELETE } = await import('@/app/api/admin/themes/route');
      const res = await DELETE(new Request('http://localhost:3000', {
        method: 'DELETE',
        body: JSON.stringify({ name: 'Hatha' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('3 cours');
    });

    it('supprime un thème inutilisé', async () => {
      prismaMock.course.count.mockResolvedValue(0);
      prismaMock.siteContent.findUnique.mockResolvedValue({
        key: 'course_themes',
        value: JSON.stringify(['Hatha', 'Vinyasa']),
      });
      prismaMock.course.findMany.mockResolvedValue([{ theme: 'Hatha' }, { theme: 'Vinyasa' }]);
      prismaMock.siteContent.upsert.mockResolvedValue({});

      const { DELETE } = await import('@/app/api/admin/themes/route');
      const res = await DELETE(new Request('http://localhost:3000', {
        method: 'DELETE',
        body: JSON.stringify({ name: 'Vinyasa' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.themes).not.toContain('Vinyasa');
    });
  });
});

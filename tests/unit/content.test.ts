import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';

import '../mocks/prisma';

describe('content lib', () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe('getContent', () => {
    it('retourne la valeur d\'une clé existante', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue({ key: 'hero_title', value: 'Bienvenue' });

      const { getContent } = await import('@/lib/content');
      const result = await getContent('hero_title');

      expect(result).toBe('Bienvenue');
      expect(prismaMock.siteContent.findUnique).toHaveBeenCalledWith({ where: { key: 'hero_title' } });
    });

    it('retourne le fallback si clé introuvable', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue(null);

      const { getContent } = await import('@/lib/content');
      const result = await getContent('missing_key', 'Valeur par défaut');

      expect(result).toBe('Valeur par défaut');
    });

    it('retourne une chaîne vide si clé introuvable sans fallback', async () => {
      prismaMock.siteContent.findUnique.mockResolvedValue(null);

      const { getContent } = await import('@/lib/content');
      const result = await getContent('missing_key');

      expect(result).toBe('');
    });
  });

  describe('getContents', () => {
    it('retourne plusieurs clés en une seule requête', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([
        { key: 'hero_title', value: 'Titre' },
        { key: 'hero_subtitle', value: 'Sous-titre' },
      ]);

      const { getContents } = await import('@/lib/content');
      const result = await getContents(['hero_title', 'hero_subtitle']);

      expect(result.hero_title).toBe('Titre');
      expect(result.hero_subtitle).toBe('Sous-titre');
    });

    it('n\'inclut pas les clés manquantes', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([
        { key: 'hero_title', value: 'Titre' },
      ]);

      const { getContents } = await import('@/lib/content');
      const result = await getContents(['hero_title', 'missing']);

      expect(result.hero_title).toBe('Titre');
      expect(result.missing).toBeUndefined();
    });

    it('retourne un objet vide si aucune clé trouvée', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([]);

      const { getContents } = await import('@/lib/content');
      const result = await getContents(['a', 'b']);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getAllContent', () => {
    it('retourne tout le contenu du site', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([
        { key: 'k1', value: 'v1' },
        { key: 'k2', value: 'v2' },
      ]);

      const { getAllContent } = await import('@/lib/content');
      const result = await getAllContent();

      expect(result.k1).toBe('v1');
      expect(result.k2).toBe('v2');
    });

    it('retourne un objet vide si aucun contenu', async () => {
      prismaMock.siteContent.findMany.mockResolvedValue([]);

      const { getAllContent } = await import('@/lib/content');
      const result = await getAllContent();

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});

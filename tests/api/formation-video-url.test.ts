import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

// Mock R2
const getPresignedUrlMock = vi.fn();
vi.mock('@/lib/r2', () => ({
  getPresignedUrl: (...args: unknown[]) => getPresignedUrlMock(...args),
}));

// Mock access helper
const canAccessFormationMock = vi.fn();
vi.mock('@/lib/helpers/access', () => ({
  canAccessFormation: (...args: unknown[]) => canAccessFormationMock(...args),
}));

const routeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

function createRequest(body?: Record<string, unknown>) {
  return new Request('http://localhost:3000', {
    method: 'POST',
    body: JSON.stringify(body || {}),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/formations/[slug]/video-url', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    canAccessFormationMock.mockReset();
    getPresignedUrlMock.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');
    const res = await POST(createRequest(), routeParams('formation'));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si formation introuvable ou non publiée', async () => {
    prismaMock.formation.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');
    const res = await POST(createRequest({ filename: 'video.mp4' }), routeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si l\'utilisateur n\'a pas accès', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal' });
    canAccessFormationMock.mockResolvedValue(false);

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');
    const res = await POST(createRequest({ filename: 'video.mp4' }), routeParams('prenatal'));
    expect(res.status).toBe(403);
  });

  it('retourne 400 si filename manquant', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal' });
    canAccessFormationMock.mockResolvedValue(true);

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');
    const res = await POST(createRequest({}), routeParams('prenatal'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('filename');
  });

  it('retourne 400 si filename contient des caractères invalides', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal' });
    canAccessFormationMock.mockResolvedValue(true);

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');

    // Path traversal
    const res1 = await POST(createRequest({ filename: '../../../etc/passwd' }), routeParams('prenatal'));
    expect(res1.status).toBe(400);

    // Espaces
    const res2 = await POST(createRequest({ filename: 'file name.mp4' }), routeParams('prenatal'));
    expect(res2.status).toBe(400);
  });

  it('retourne l\'URL présignée avec un filename valide', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal' });
    canAccessFormationMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/signed-url');

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');
    const res = await POST(createRequest({ filename: 'chapitre-1.mp4' }), routeParams('prenatal'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://r2.example.com/signed-url');
    expect(getPresignedUrlMock).toHaveBeenCalledWith('formations/prenatal/videos/chapitre-1.mp4');
  });

  it('accepte des filenames avec points, tirets, underscores', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal' });
    canAccessFormationMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/signed');

    const { POST } = await import('@/app/api/formations/[slug]/video-url/route');

    const validNames = ['video.mp4', 'chapitre-01.mp4', 'module_3_intro.mp4', 'V1.2.mp4'];
    for (const filename of validNames) {
      const res = await POST(createRequest({ filename }), routeParams('prenatal'));
      expect(res.status).toBe(200);
    }
  });
});

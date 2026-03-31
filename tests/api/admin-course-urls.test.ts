import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

// Mock R2
const getPresignedUrlMock = vi.fn();
vi.mock('@/lib/r2', () => ({
  getPresignedUrl: (...args: unknown[]) => getPresignedUrlMock(...args),
}));

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/admin/courses/[id]/thumbnail-url', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
    getPresignedUrlMock.mockReset();
  });

  it('retourne 403 si non admin', async () => {
    setSession(mockSession);

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(403);
  });

  it('retourne 403 si non connecté', async () => {
    setSession(null);

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(403);
  });

  it('retourne 404 si pas de miniature', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ thumbnail: null });

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(404);
  });

  it('retourne 404 si cours introuvable', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(404);
  });

  it('retourne l\'URL publique directement si c\'est déjà une URL http', async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      thumbnail: 'https://example.com/image.jpg',
    });

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://example.com/image.jpg');
    expect(getPresignedUrlMock).not.toHaveBeenCalled();
  });

  it('retourne une URL présignée pour un thumbnail R2', async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      thumbnail: 'cours/yoga/thumbnail.jpg',
    });
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/signed');

    const { GET } = await import('@/app/api/admin/courses/[id]/thumbnail-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://r2.example.com/signed');
    expect(getPresignedUrlMock).toHaveBeenCalledWith('cours/yoga/thumbnail.jpg', 3600);
  });
});

describe('GET /api/admin/courses/[id]/video-url', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
    getPresignedUrlMock.mockReset();
  });

  it('retourne 403 si non admin', async () => {
    setSession(mockSession);

    const { GET } = await import('@/app/api/admin/courses/[id]/video-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(403);
  });

  it('retourne 404 si pas de vidéo', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ slug: 'yoga', videoUrl: null });

    const { GET } = await import('@/app/api/admin/courses/[id]/video-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(404);
  });

  it('retourne 404 si cours introuvable', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/admin/courses/[id]/video-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    expect(res.status).toBe(404);
  });

  it('retourne l\'URL présignée de la vidéo', async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      slug: 'yoga-doux', videoUrl: 'cours/yoga-doux/video.mp4',
    });
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/video-signed');

    const { GET } = await import('@/app/api/admin/courses/[id]/video-url/route');
    const res = await GET(new Request('http://localhost:3000'), routeParams('abc'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://r2.example.com/video-signed');
    expect(getPresignedUrlMock).toHaveBeenCalledWith('cours/yoga-doux/video.mp4', 3600);
  });
});

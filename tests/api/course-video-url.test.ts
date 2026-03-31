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
const canAccessCourseMock = vi.fn();
vi.mock('@/lib/helpers/access', () => ({
  canAccessCourse: (...args: unknown[]) => canAccessCourseMock(...args),
}));

const routeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe('POST /api/cours/[slug]/video-url', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    canAccessCourseMock.mockReset();
    getPresignedUrlMock.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/cours/[slug]/video-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('yoga'));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si cours introuvable ou non publié', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/cours/[slug]/video-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si l\'utilisateur n\'a pas accès', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: 'c-1', slug: 'yoga' });
    canAccessCourseMock.mockResolvedValue(false);

    const { POST } = await import('@/app/api/cours/[slug]/video-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('yoga'));
    expect(res.status).toBe(403);
  });

  it('retourne l\'URL présignée si accès autorisé', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: 'c-1', slug: 'yoga' });
    canAccessCourseMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/cours/yoga/video.mp4?signed=1');

    const { POST } = await import('@/app/api/cours/[slug]/video-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('yoga'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://r2.example.com/cours/yoga/video.mp4?signed=1');
    expect(getPresignedUrlMock).toHaveBeenCalledWith('cours/yoga/video.mp4');
  });

  it('vérifie l\'accès avec le bon userId et courseId', async () => {
    prismaMock.course.findUnique.mockResolvedValue({ id: 'c-42', slug: 'meditation' });
    canAccessCourseMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/signed');

    const { POST } = await import('@/app/api/cours/[slug]/video-url/route');
    await POST(new Request('http://localhost:3000'), routeParams('meditation'));

    expect(canAccessCourseMock).toHaveBeenCalledWith('user-1', 'c-42');
  });
});

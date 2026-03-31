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

describe('POST /api/formations/[slug]/guide-url', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    canAccessFormationMock.mockReset();
    getPresignedUrlMock.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/formations/[slug]/guide-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('prenatal'));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si formation introuvable', async () => {
    prismaMock.formation.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/formations/[slug]/guide-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('nonexistent'));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain('introuvable');
  });

  it('retourne 403 si l\'utilisateur n\'a pas accès', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({
      id: 'f-1', slug: 'prenatal', bookletUrl: 'formations/prenatal/guide.pdf',
    });
    canAccessFormationMock.mockResolvedValue(false);

    const { POST } = await import('@/app/api/formations/[slug]/guide-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('prenatal'));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('refusé');
  });

  it('retourne l\'URL présignée du guide PDF', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({
      id: 'f-1', slug: 'prenatal', bookletUrl: 'formations/prenatal/guide.pdf',
    });
    canAccessFormationMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/formations/prenatal/guide.pdf?signed=1');

    const { POST } = await import('@/app/api/formations/[slug]/guide-url/route');
    const res = await POST(new Request('http://localhost:3000'), routeParams('prenatal'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://r2.example.com/formations/prenatal/guide.pdf?signed=1');
    expect(getPresignedUrlMock).toHaveBeenCalledWith('formations/prenatal/guide.pdf');
  });

  it('vérifie l\'accès avec le bon userId et formationId', async () => {
    prismaMock.formation.findUnique.mockResolvedValue({
      id: 'f-42', slug: 'advanced', bookletUrl: 'formations/advanced/guide.pdf',
    });
    canAccessFormationMock.mockResolvedValue(true);
    getPresignedUrlMock.mockResolvedValue('https://r2.example.com/signed');

    const { POST } = await import('@/app/api/formations/[slug]/guide-url/route');
    await POST(new Request('http://localhost:3000'), routeParams('advanced'));

    expect(canAccessFormationMock).toHaveBeenCalledWith('user-1', 'f-42');
  });
});

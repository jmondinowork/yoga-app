import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { authMock, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock stripe module to force simulation mode
vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: true,
  PLANS: [
    { id: 'monthly', name: 'Mensuel', price: 19.99, priceId: '', interval: 'month' },
    { id: 'annual', name: 'Annuel', price: 14.99, priceId: '', interval: 'year', badge: 'Meilleure offre' },
  ],
  getStripe: vi.fn(),
  stripe: {},
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/stripe/checkout'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/stripe/checkout (simulation)', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non connecté', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const res = await POST(createRequest({ type: 'subscription', planId: 'monthly' }));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si utilisateur introuvable', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const res = await POST(createRequest({ type: 'subscription', planId: 'monthly' }));
    expect(res.status).toBe(404);
  });

  describe('Abonnement', () => {
    it('crée un abonnement mensuel simulé', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.upsert.mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'monthly' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toContain('success=true');
      expect(json.url).toContain('type=subscription');
      expect(prismaMock.subscription.upsert).toHaveBeenCalled();
    });

    it('crée un abonnement annuel simulé', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.upsert.mockResolvedValue({ id: 'sub-1', plan: 'ANNUAL', status: 'ACTIVE' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'annual' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ plan: 'ANNUAL' }),
        })
      );
    });

    it('rejette si abo actif existant', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.subscription.findUnique.mockResolvedValue({ status: 'ACTIVE', cancelAtPeriodEnd: false });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'monthly' }));
      expect(res.status).toBe(400);
    });

    it('retourne 400 si plan invalide', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'invalid' }));
      expect(res.status).toBe(400);
    });
  });

  describe('Achat de cours', () => {
    it('crée un achat de cours simulé', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.course.findUnique.mockResolvedValue({ id: 'c-1', slug: 'yoga', price: 29.99 });
      prismaMock.purchase.findFirst.mockResolvedValue(null);
      prismaMock.purchase.create.mockResolvedValue({ id: 'p-1' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'course', courseId: 'c-1' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toContain('/cours/yoga');
      expect(prismaMock.purchase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ courseId: 'c-1', amount: 29.99 }),
        })
      );
    });

    it('rejette si cours déjà acheté', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.course.findUnique.mockResolvedValue({ id: 'c-1', slug: 'yoga', price: 29.99 });
      prismaMock.purchase.findFirst.mockResolvedValue({ id: 'existing' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'course', courseId: 'c-1' }));
      expect(res.status).toBe(400);
    });

    it('retourne 404 si cours introuvable', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.course.findUnique.mockResolvedValue(null);

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'course', courseId: 'nonexistent' }));
      expect(res.status).toBe(404);
    });
  });

  describe('Achat de formation', () => {
    it('crée un achat de formation simulé', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', slug: 'prenatal', price: 49.99 });
      prismaMock.purchase.findFirst.mockResolvedValue(null);
      prismaMock.purchase.create.mockResolvedValue({ id: 'p-1' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'formation', courseId: 'f-1' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toContain('/formations/prenatal');
    });
  });

  it('retourne 400 pour un type invalide', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });

    const { POST } = await import('@/app/api/stripe/checkout/route');
    const res = await POST(createRequest({ type: 'invalid' }));
    expect(res.status).toBe(400);
  });
});

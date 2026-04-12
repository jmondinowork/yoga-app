import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock Stripe en mode réel (SIMULATE_PAYMENTS = false)
const stripeCustomersCreate = vi.fn();
const stripeCheckoutCreate = vi.fn();

vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: false,
  PLANS_FALLBACK: [
    { id: 'monthly', name: 'Mensuel', price: 22, priceId: 'price_monthly_123', interval: 'month' },
    { id: 'annual', name: 'Annuel', price: 200, priceId: 'price_annual_456', interval: 'year', badge: 'Meilleure offre' },
  ],
  getPlans: vi.fn().mockResolvedValue([
    { id: 'monthly', name: 'Mensuel', price: 22, priceId: 'price_monthly_123', interval: 'month' },
    { id: 'annual', name: 'Annuel', price: 200, priceId: 'price_annual_456', interval: 'year', badge: 'Meilleure offre' },
  ]),
  getStripe: vi.fn(),
  stripe: {
    customers: { create: (...args: unknown[]) => stripeCustomersCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => stripeCheckoutCreate(...args) } },
  },
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: Date.now() + 900000 })),
  rateLimitResponse: vi.fn(),
}));

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(new URL('http://localhost:3000/api/stripe/checkout'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/stripe/checkout (mode Stripe réel)', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    stripeCustomersCreate.mockReset();
    stripeCheckoutCreate.mockReset();
  });

  describe('Gestion du client Stripe', () => {
    it('crée un client Stripe si l\'utilisateur n\'en a pas', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        stripeCustomerId: null,
      });
      stripeCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });
      prismaMock.user.update.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/checkout/route');
      await POST(createRequest({ type: 'subscription', planId: 'monthly' }));

      expect(stripeCustomersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          name: 'Test User',
          metadata: { userId: 'user-1' },
        })
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { stripeCustomerId: 'cus_new123' },
      });
    });

    it('réutilise le client Stripe existant', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        stripeCustomerId: 'cus_existing',
      });
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      await POST(createRequest({ type: 'subscription', planId: 'monthly' }));

      expect(stripeCustomersCreate).not.toHaveBeenCalled();
    });
  });

  describe('Abonnement Stripe', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        stripeCustomerId: 'cus_123',
      });
    });

    it('crée une session Stripe pour abonnement mensuel', async () => {
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub-monthly' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'monthly' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toBe('https://checkout.stripe.com/sub-monthly');
      expect(stripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          mode: 'subscription',
          line_items: [{ price: 'price_monthly_123', quantity: 1 }],
          metadata: { userId: 'user-1', planId: 'monthly' },
          allow_promotion_codes: true,
          locale: 'fr',
        })
      );
    });

    it('crée une session Stripe pour abonnement annuel', async () => {
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/sub-annual' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'subscription', planId: 'annual' }));
      const json = await res.json();

      expect(json.url).toBe('https://checkout.stripe.com/sub-annual');
      expect(stripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_annual_456', quantity: 1 }],
          metadata: { userId: 'user-1', planId: 'annual' },
        })
      );
    });

    it('inclut les URLs de succès et annulation correctes', async () => {
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      await POST(createRequest({ type: 'subscription', planId: 'monthly' }));

      expect(stripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('/mon-espace?success=true&type=subscription'),
          cancel_url: expect.stringContaining('/tarifs?canceled=true'),
        })
      );
    });
  });

  describe('Achat de cours Stripe', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        stripeCustomerId: 'cus_123',
      });
    });

    it('crée une session payment pour un cours', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: 'c-1',
        title: 'Yoga Vinyasa',
        slug: 'yoga-vinyasa',
        price: 5.99,
      });
      prismaMock.purchase.findFirst.mockResolvedValue(null);
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/course' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'course', courseId: 'c-1' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toBe('https://checkout.stripe.com/course');
      expect(stripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur',
                unit_amount: 599, // 5.99 * 100
                product_data: expect.objectContaining({
                  name: 'Yoga Vinyasa',
                  description: expect.stringContaining('Location 72h'),
                }),
              }),
            }),
          ],
          metadata: { userId: 'user-1', type: 'course', itemId: 'c-1' },
        })
      );
    });

    it('rejette si location active existante', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: 'c-1', title: 'Yoga', slug: 'yoga', price: 5.99 });
      prismaMock.purchase.findFirst.mockResolvedValue({ id: 'rental-1' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'course', courseId: 'c-1' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('location active');
    });
  });

  describe('Achat de formation Stripe', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        stripeCustomerId: 'cus_123',
      });
    });

    it('crée une session payment pour une formation', async () => {
      prismaMock.formation.findUnique.mockResolvedValue({
        id: 'f-1',
        title: 'Yoga Prénatal',
        slug: 'yoga-prenatal',
        price: 200,
      });
      prismaMock.purchase.findFirst.mockResolvedValue(null);
      stripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/formation' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'formation', courseId: 'f-1' }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(stripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 20000, // 200 * 100
                product_data: expect.objectContaining({
                  description: expect.stringContaining('Accès illimité'),
                }),
              }),
            }),
          ],
          metadata: { userId: 'user-1', type: 'formation', itemId: 'f-1' },
        })
      );
    });

    it('rejette si formation déjà achetée', async () => {
      prismaMock.formation.findUnique.mockResolvedValue({ id: 'f-1', title: 'Yoga', slug: 'yoga', price: 200 });
      prismaMock.purchase.findFirst.mockResolvedValue({ id: 'p-1' });

      const { POST } = await import('@/app/api/stripe/checkout/route');
      const res = await POST(createRequest({ type: 'formation', courseId: 'f-1' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('déjà acheté');
    });
  });
});

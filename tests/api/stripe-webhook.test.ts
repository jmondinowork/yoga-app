import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === 'stripe-signature') return 'sig_test_123';
      return null;
    }),
  }),
}));

// Stripe mock
const stripeWebhooksConstructEvent = vi.fn();
const stripeSubscriptionsRetrieve = vi.fn();

vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: false,
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => stripeWebhooksConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => stripeSubscriptionsRetrieve(...args),
    },
  },
}));

// Nécessaire car le module lit process.env.STRIPE_WEBHOOK_SECRET au chargement
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

function createWebhookRequest(body: string) {
  return new NextRequest(new URL('http://localhost:3000/api/stripe/webhook'), {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'sig_test_123' },
  });
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    resetPrismaMock();
    stripeWebhooksConstructEvent.mockReset();
    stripeSubscriptionsRetrieve.mockReset();
  });

  it('retourne 400 si la signature est invalide', async () => {
    stripeWebhooksConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const res = await POST(createWebhookRequest('{}'));
    expect(res.status).toBe(400);
  });

  it('ignore les événements déjà traités (idempotence)', async () => {
    stripeWebhooksConstructEvent.mockReturnValue({
      id: 'evt_duplicate',
      type: 'checkout.session.completed',
      data: { object: {} },
    });
    // Simuler P2002 (unique constraint violation) sur le create
    const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    prismaMock.stripeEvent.create.mockRejectedValue(p2002Error);

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const res = await POST(createWebhookRequest('{}'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
  });

  describe('checkout.session.completed', () => {
    it('crée un achat de cours avec location 72h', async () => {
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_course_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-1', type: 'course', itemId: 'c-1' },
            amount_total: 599,
            payment_intent: 'pi_course_123',
            mode: 'payment',
          },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});
      prismaMock.purchase.create.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          courseId: 'c-1',
          amount: 5.99, // 599 / 100
          stripePaymentId: 'pi_course_123',
          expiresAt: expect.any(Date),
        }),
      });

      // Vérifier que expiresAt est dans ~72h
      const callArgs = prismaMock.purchase.create.mock.calls[0][0].data;
      const hours = (callArgs.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hours).toBeCloseTo(72, 0);
    });

    it('crée un achat de formation (accès permanent, pas d\'expiresAt)', async () => {
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_formation_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-1', type: 'formation', itemId: 'f-1' },
            amount_total: 20000,
            payment_intent: 'pi_formation_123',
            mode: 'payment',
          },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});
      prismaMock.purchase.create.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.purchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          formationId: 'f-1',
          amount: 200,
          stripePaymentId: 'pi_formation_123',
        }),
      });
      // Formation: pas de expiresAt
      const callArgs = prismaMock.purchase.create.mock.calls[0][0].data;
      expect(callArgs.expiresAt).toBeUndefined();
    });

    it('crée un abonnement via checkout.session.completed', async () => {
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_sub_1',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { userId: 'user-1', planId: 'monthly' },
            mode: 'subscription',
            subscription: 'sub_stripe_123',
          },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});

      const now = Math.floor(Date.now() / 1000);
      stripeSubscriptionsRetrieve.mockResolvedValue({
        items: {
          data: [{
            current_period_start: now,
            current_period_end: now + 30 * 86400,
          }],
        },
        cancel_at_period_end: false,
        status: 'active',
      });
      prismaMock.subscription.upsert.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: 'sub_stripe_123' },
          create: expect.objectContaining({
            userId: 'user-1',
            plan: 'MONTHLY',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('passe l\'abonnement en PAST_DUE', async () => {
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_fail_1',
        type: 'invoice.payment_failed',
        data: {
          object: {
            parent: {
              subscription_details: { subscription: 'sub_stripe_fail' },
            },
          },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});
      prismaMock.subscription.updateMany.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_stripe_fail' },
        data: { status: 'PAST_DUE' },
      });
    });
  });

  describe('customer.subscription.updated', () => {
    it('synchronise le statut et les dates de période', async () => {
      const now = Math.floor(Date.now() / 1000);
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_update_1',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_updated',
            status: 'active',
            cancel_at_period_end: true,
            items: {
              data: [{
                current_period_start: now,
                current_period_end: now + 30 * 86400,
              }],
            },
          },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});
      prismaMock.subscription.updateMany.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_stripe_updated' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          cancelAtPeriodEnd: true,
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        }),
      });
    });

    it('mappe les statuts Stripe vers les statuts DB', async () => {
      const statusMappings: Record<string, string> = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'PAST_DUE',
        trialing: 'ACTIVE',
        incomplete: 'PAST_DUE',
        incomplete_expired: 'CANCELED',
        paused: 'CANCELED',
      };

      for (const [stripeStatus, expectedDbStatus] of Object.entries(statusMappings)) {
        resetPrismaMock();
        stripeWebhooksConstructEvent.mockReturnValue({
          id: `evt_status_${stripeStatus}`,
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: `sub_${stripeStatus}`,
              status: stripeStatus,
              cancel_at_period_end: false,
              items: { data: [] },
            },
          },
        });
        prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
        prismaMock.stripeEvent.create.mockResolvedValue({});
        prismaMock.subscription.updateMany.mockResolvedValue({});

        const { POST } = await import('@/app/api/stripe/webhook/route');
        await POST(createWebhookRequest('{}'));

        expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: expectedDbStatus }),
          })
        );
      }
    });
  });

  describe('customer.subscription.deleted', () => {
    it('passe l\'abonnement en CANCELED', async () => {
      stripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_delete_1',
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub_stripe_deleted' },
        },
      });
      prismaMock.stripeEvent.findUnique.mockResolvedValue(null);
      prismaMock.stripeEvent.create.mockResolvedValue({});
      prismaMock.subscription.updateMany.mockResolvedValue({});

      const { POST } = await import('@/app/api/stripe/webhook/route');
      const res = await POST(createWebhookRequest('{}'));

      expect(res.status).toBe(200);
      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_stripe_deleted' },
        data: { status: 'CANCELED', cancelAtPeriodEnd: false },
      });
    });
  });
});

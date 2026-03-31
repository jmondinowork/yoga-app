import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: false,
  stripe: {
    subscriptions: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('POST /api/stripe/cancel', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('retourne 400 si pas d\'abonnement actif', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Aucun abonnement');
  });

  it('retourne 400 si abonnement déjà annulé', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      status: 'CANCELED',
      stripeSubscriptionId: 'sub_123',
    });

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it('retourne 400 si abonnement PAST_DUE', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      status: 'PAST_DUE',
      stripeSubscriptionId: 'sub_123',
    });

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it('annule l\'abonnement Stripe et met à jour la base', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      stripeSubscriptionId: 'sub_123',
    });
    prismaMock.subscription.update.mockResolvedValue({});

    const { stripe } = await import('@/lib/stripe');

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true,
    });
    expect(prismaMock.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { cancelAtPeriodEnd: true },
    });
  });
});

describe('POST /api/stripe/cancel (simulation)', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    vi.resetModules();
  });

  it('annule en mode simulation sans appeler Stripe', async () => {
    // Re-mock en mode simulation
    vi.doMock('@/lib/stripe', () => ({
      SIMULATE_PAYMENTS: true,
      stripe: {
        subscriptions: { update: vi.fn() },
      },
    }));

    prismaMock.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
      stripeSubscriptionId: 'sim_sub_123',
    });
    prismaMock.subscription.update.mockResolvedValue({});

    const { POST } = await import('@/app/api/stripe/cancel/route');
    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { cancelAtPeriodEnd: true },
    });
  });
});

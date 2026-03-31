import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

const stripeBillingPortalCreate = vi.fn();

// Mock Stripe en mode réel
vi.mock('@/lib/stripe', () => ({
  SIMULATE_PAYMENTS: false,
  stripe: {
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) => stripeBillingPortalCreate(...args),
      },
    },
  },
}));

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
    stripeBillingPortalCreate.mockReset();
  });

  it('retourne 401 si non authentifié', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/stripe/portal/route');
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('retourne 400 si pas de stripeCustomerId', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', stripeCustomerId: null });

    const { POST } = await import('@/app/api/stripe/portal/route');
    const res = await POST();
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Aucun compte Stripe');
  });

  it('crée une session Stripe Billing Portal', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', stripeCustomerId: 'cus_123' });
    stripeBillingPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal123' });

    const { POST } = await import('@/app/api/stripe/portal/route');
    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://billing.stripe.com/portal123');
    expect(stripeBillingPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
        return_url: expect.stringContaining('/mon-espace/parametres'),
      })
    );
  });
});

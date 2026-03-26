import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('stripe config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('SIMULATE_PAYMENTS est true quand STRIPE_SECRET_KEY est absent', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { SIMULATE_PAYMENTS } = await import('@/lib/stripe');
    expect(SIMULATE_PAYMENTS).toBe(true);
  });

  it('SIMULATE_PAYMENTS est true quand SIMULATE_PAYMENTS env est "true"', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('SIMULATE_PAYMENTS', 'true');
    const { SIMULATE_PAYMENTS } = await import('@/lib/stripe');
    expect(SIMULATE_PAYMENTS).toBe(true);
  });

  it('PLANS contient les plans mensuel et annuel', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { PLANS } = await import('@/lib/stripe');
    expect(PLANS).toHaveLength(2);
    expect(PLANS[0].id).toBe('monthly');
    expect(PLANS[1].id).toBe('annual');
    expect(PLANS[0].price).toBe(19.99);
    expect(PLANS[1].price).toBe(14.99);
  });

  it('PLANS annuel a le badge "Meilleure offre"', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { PLANS } = await import('@/lib/stripe');
    expect(PLANS[1].badge).toBe('Meilleure offre');
    expect(PLANS[0]).not.toHaveProperty('badge');
  });

  it('getStripe() lève une erreur en mode simulation', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const { getStripe } = await import('@/lib/stripe');
    expect(() => getStripe()).toThrow('Stripe n\'est pas configuré');
  });
});

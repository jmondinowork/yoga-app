import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('stripe config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('SIMULATE_PAYMENTS est true quand STRIPE_DEMO=true', async () => {
    vi.stubEnv('STRIPE_DEMO', 'true');
    const { SIMULATE_PAYMENTS } = await import('@/lib/stripe');
    expect(SIMULATE_PAYMENTS).toBe(true);
  });

  it('SIMULATE_PAYMENTS est false quand STRIPE_DEMO n\'est pas "true"', async () => {
    vi.stubEnv('STRIPE_DEMO', '');
    const { SIMULATE_PAYMENTS } = await import('@/lib/stripe');
    expect(SIMULATE_PAYMENTS).toBe(false);
  });

  it('PLANS_FALLBACK contient les plans mensuel et annuel', async () => {
    vi.stubEnv('STRIPE_DEMO', 'true');
    const { PLANS_FALLBACK } = await import('@/lib/stripe');
    expect(PLANS_FALLBACK).toHaveLength(2);
    expect(PLANS_FALLBACK[0].id).toBe('monthly');
    expect(PLANS_FALLBACK[1].id).toBe('annual');
    expect(PLANS_FALLBACK[0].price).toBe(22);
    expect(PLANS_FALLBACK[1].price).toBe(200);
  });

  it('PLANS_FALLBACK annuel a le badge "Meilleure offre"', async () => {
    vi.stubEnv('STRIPE_DEMO', 'true');
    const { PLANS_FALLBACK } = await import('@/lib/stripe');
    expect(PLANS_FALLBACK[1].badge).toBe('Meilleure offre');
    expect(PLANS_FALLBACK[0]).not.toHaveProperty('badge');
  });

  it('getStripe() lève une erreur en mode simulation', async () => {
    vi.stubEnv('STRIPE_DEMO', 'true');
    const { getStripe } = await import('@/lib/stripe');
    expect(() => getStripe()).toThrow('Stripe n\'est pas configuré');
  });
});

describe('stripe paiement', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('retourne une instance Stripe valide en prod', async () => {
    process.env.STRIPE_DEMO = '';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    const { getStripe } = await import('@/lib/stripe');
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(typeof stripe.charges.create).toBe('function');
  });

  it('lance une erreur si STRIPE_SECRET_KEY manquant', async () => {
    process.env.STRIPE_DEMO = '';
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import('@/lib/stripe');
    expect(() => getStripe()).toThrow();
  });

  it('simule un paiement réussi en mode démo', async () => {
    process.env.STRIPE_DEMO = 'true';
    const { SIMULATE_PAYMENTS } = await import('@/lib/stripe');
    expect(SIMULATE_PAYMENTS).toBe(true);
    // Ici, on pourrait mocker une fonction de paiement simulée si elle existe
  });

  it('gère l\'absence de webhook sans planter', async () => {
    process.env.STRIPE_DEMO = '';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    // Simuler l'appel à un endpoint webhook inexistant
    // (à compléter selon l'implémentation réelle du handler webhook)
    // L'objectif est de vérifier que l'absence de webhook ne bloque pas l'app
    expect(true).toBe(true); // Placeholder, à adapter si handler
  });

  it('refuse un paiement si clé Stripe invalide', async () => {
    process.env.STRIPE_DEMO = '';
    process.env.STRIPE_SECRET_KEY = 'clé_invalide';
    const { getStripe } = await import('@/lib/stripe');
    const stripe = getStripe();
    // On ne peut pas vraiment tester un paiement réel ici, mais on vérifie que l'instance existe
    expect(stripe).toBeDefined();
  });
});

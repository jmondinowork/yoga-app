import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the real module (no mocking)
// We need to reset the module state between tests
describe('rateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('autorise la première requête', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const result = rateLimit('test-1', 5, 60000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('décrémente le compteur restant', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    rateLimit('test-decr', 5, 60000);
    const result2 = rateLimit('test-decr', 5, 60000);
    const result3 = rateLimit('test-decr', 5, 60000);

    expect(result2.remaining).toBe(3);
    expect(result3.remaining).toBe(2);
  });

  it('bloque après avoir atteint la limite', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    for (let i = 0; i < 5; i++) {
      rateLimit('test-block', 5, 60000);
    }

    const result = rateLimit('test-block', 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('utilise des clés indépendantes', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    for (let i = 0; i < 5; i++) {
      rateLimit('key-a', 5, 60000);
    }

    // key-a est bloquée, mais key-b est encore disponible
    const resultA = rateLimit('key-a', 5, 60000);
    const resultB = rateLimit('key-b', 5, 60000);

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('retourne resetAt dans le futur', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    const result = rateLimit('test-reset', 5, 15 * 60 * 1000); // 15 min
    const fifteenMinFromNow = Date.now() + 15 * 60 * 1000;

    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(fifteenMinFromNow + 100);
  });

  it('autorise une seule requête avec limit=1', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');

    const r1 = rateLimit('strict', 1, 60000);
    const r2 = rateLimit('strict', 1, 60000);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(0);
    expect(r2.allowed).toBe(false);
  });
});

describe('rateLimitResponse', () => {
  it('retourne une réponse 429 avec Retry-After', async () => {
    const { rateLimitResponse } = await import('@/lib/rate-limit');
    const resetAt = Date.now() + 30000; // 30 secondes
    const res = rateLimitResponse(resetAt);

    expect(res.status).toBe(429);
    expect(res.headers.get('Content-Type')).toBe('application/json');

    const retryAfter = parseInt(res.headers.get('Retry-After') || '0');
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(30);

    const json = await res.json();
    expect(json.error).toContain('Trop de requêtes');
  });

  it('retourne Retry-After=0 si resetAt est dépassé', async () => {
    const { rateLimitResponse } = await import('@/lib/rate-limit');
    const resetAt = Date.now() - 1000; // déjà passé
    const res = rateLimitResponse(resetAt);

    expect(res.status).toBe(429);
    const retryAfter = parseInt(res.headers.get('Retry-After') || '0');
    expect(retryAfter).toBeLessThanOrEqual(0);
  });
});

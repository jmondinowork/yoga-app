import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

vi.mock('@/lib/stripe', () => ({
  getPlans: vi.fn().mockResolvedValue([
    { id: 'monthly', name: 'Mensuel', price: 22, priceId: '', interval: 'month' },
    { id: 'annual', name: 'Annuel', price: 200, priceId: '', interval: 'year' },
  ]),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/subscriptions');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe('GET /api/admin/subscriptions', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  it('retourne 403 si non admin', async () => {
    setSession(mockSession);
    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('retourne 403 si non connecté', async () => {
    setSession(null);
    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('retourne les statistiques de revenus complètes', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([
      { id: 's1', plan: 'MONTHLY', status: 'ACTIVE', user: { id: 'u1', name: 'Alice', email: 'alice@test.com' } },
    ]);
    prismaMock.purchase.findMany
      .mockResolvedValueOnce([
        { id: 'p1', amount: 200, formationId: 'f1', courseId: null, user: { id: 'u1' }, formation: { title: 'Formation A' }, course: null },
      ])
      .mockResolvedValueOnce([
        { id: 'p2', amount: 5.99, formationId: null, courseId: 'c1', user: { id: 'u2' }, formation: null, course: { title: 'Cours B' } },
      ]);
    prismaMock.subscription.count
      .mockResolvedValueOnce(4)   // subscriptionCount (total)
      .mockResolvedValueOnce(3)   // monthlySubs
      .mockResolvedValueOnce(1);  // annualSubs
    prismaMock.purchase.count
      .mockResolvedValueOnce(2)   // purchaseCount (total)
      .mockResolvedValueOnce(1)   // totalFormationCount
      .mockResolvedValueOnce(1);  // totalCourseRentalCount
    prismaMock.purchase.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 205.99 } })  // totalPurchaseRevenue
      .mockResolvedValueOnce({ _sum: { amount: 200 } })     // totalFormationRevenue
      .mockResolvedValueOnce({ _sum: { amount: 5.99 } });   // totalCourseRentalRevenue

    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.subscriptions).toHaveLength(1);
    expect(json.formationPurchases).toHaveLength(1);
    expect(json.courseRentals).toHaveLength(1);
    expect(json.stats.monthlyActive).toBe(3);
    expect(json.stats.annualActive).toBe(1);
    expect(json.stats.totalFormationPurchases).toBe(1);
    expect(json.stats.formationRevenue).toBe(200);
    expect(json.stats.totalCourseRentals).toBe(1);
    expect(json.stats.courseRentalRevenue).toBe(5.99);
    // totalRevenue = purchaseRevenue (205.99) + mrrTotal (3*22 + 1*(200/12))
    expect(json.stats.totalRevenue).toBeCloseTo(205.99 + 3 * 22 + 200 / 12, 2);
  });

  it('retourne zéro si aucune donnée', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([]);
    prismaMock.purchase.findMany.mockResolvedValue([]);
    prismaMock.subscription.count.mockResolvedValue(0);
    prismaMock.purchase.count.mockResolvedValue(0);
    prismaMock.purchase.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: 0,
    });

    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.stats.totalRevenue).toBe(0);
    expect(json.stats.monthlyActive).toBe(0);
    expect(json.stats.annualActive).toBe(0);
  });
});

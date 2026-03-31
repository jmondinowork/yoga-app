import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';

import '../mocks/prisma';
import '../mocks/auth';

describe('GET /api/admin/subscriptions', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  it('retourne 403 si non admin', async () => {
    setSession(mockSession);
    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('retourne 403 si non connecté', async () => {
    setSession(null);
    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('retourne les statistiques de revenus complètes', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([
      { id: 's1', plan: 'MONTHLY', status: 'ACTIVE', user: { id: 'u1', name: 'Alice', email: 'alice@test.com' } },
    ]);
    prismaMock.purchase.findMany.mockResolvedValue([
      { id: 'p1', amount: 200, formationId: 'f1', courseId: null, user: { id: 'u1' }, formation: { title: 'Formation A' }, course: null },
      { id: 'p2', amount: 5.99, formationId: null, courseId: 'c1', user: { id: 'u2' }, formation: null, course: { title: 'Cours B' } },
    ]);
    prismaMock.subscription.count
      .mockResolvedValueOnce(3) // monthly
      .mockResolvedValueOnce(1); // annual
    prismaMock.purchase.aggregate.mockResolvedValue({
      _sum: { amount: 205.99 },
      _count: 2,
    });

    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET();
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
    expect(json.stats.totalRevenue).toBe(205.99);
  });

  it('retourne zéro si aucune donnée', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([]);
    prismaMock.purchase.findMany.mockResolvedValue([]);
    prismaMock.subscription.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prismaMock.purchase.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: 0,
    });

    const { GET } = await import('@/app/api/admin/subscriptions/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.stats.totalRevenue).toBe(0);
    expect(json.stats.monthlyActive).toBe(0);
    expect(json.stats.annualActive).toBe(0);
  });
});

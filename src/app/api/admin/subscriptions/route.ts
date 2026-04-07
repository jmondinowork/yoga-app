import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { SIMULATE_PAYMENTS, getStripe, PLANS } from '@/lib/stripe';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Statistiques revenus : abonnements, achats formations, locations cours (paginé)
export async function GET(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  const userFilter = { user: { role: Role.USER } };

  const [
    subscriptions,
    subscriptionCount,
    allPurchases,
    purchaseCount,
    monthlySubs,
    annualSubs,
    totalPurchaseRevenue,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: userFilter,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.subscription.count({ where: userFilter }),
    prisma.purchase.findMany({
      where: userFilter,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        formation: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where: userFilter }),
    prisma.subscription.count({
      where: { plan: 'MONTHLY', status: 'ACTIVE', ...userFilter },
    }),
    prisma.subscription.count({
      where: { plan: 'ANNUAL', status: 'ACTIVE', ...userFilter },
    }),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      _count: true,
      where: userFilter,
    }),
  ]);

  // Séparer achats formations vs locations cours
  const formationPurchases = allPurchases.filter(p => p.formationId != null);
  const courseRentals = allPurchases.filter(p => p.courseId != null);

  // Stats abonnements : Stripe réel ou fallback Prisma
  let monthlyActive = monthlySubs;
  let annualActive = annualSubs;

  if (!SIMULATE_PAYMENTS) {
    try {
      const stripeClient = getStripe();
      const monthlyPriceId = PLANS.find(p => p.id === 'monthly')?.priceId;
      const annualPriceId = PLANS.find(p => p.id === 'annual')?.priceId;

      // Compter les abonnements actifs Stripe par price_id
      async function countActiveSubscriptions(priceId: string | undefined): Promise<number> {
        if (!priceId) return 0;
        let count = 0;
        let hasMore = true;
        let startingAfter: string | undefined;
        while (hasMore) {
          const params: Record<string, unknown> = { price: priceId, status: 'active', limit: 100 };
          if (startingAfter) params.starting_after = startingAfter;
          const batch = await stripeClient.subscriptions.list(params as Parameters<typeof stripeClient.subscriptions.list>[0]);
          count += batch.data.length;
          hasMore = batch.has_more;
          if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
        }
        return count;
      }

      [monthlyActive, annualActive] = await Promise.all([
        countActiveSubscriptions(monthlyPriceId),
        countActiveSubscriptions(annualPriceId),
      ]);
    } catch (e) {
      console.error('Stripe subscriptions fetch failed, using Prisma fallback', e);
    }
  }

  const purchaseRevenue = totalPurchaseRevenue._sum.amount || 0;
  const mrrTotal = monthlyActive * 22 + annualActive * (200 / 12);

  return NextResponse.json({
    subscriptions,
    formationPurchases,
    courseRentals,
    stats: {
      monthlyActive,
      annualActive,
      totalFormationPurchases: formationPurchases.length,
      formationRevenue: formationPurchases.reduce((sum, p) => sum + p.amount, 0),
      totalCourseRentals: courseRentals.length,
      courseRentalRevenue: courseRentals.reduce((sum, p) => sum + p.amount, 0),
      totalRevenue: purchaseRevenue + mrrTotal,
    },
    pagination: {
      page,
      limit,
      totalSubscriptions: subscriptionCount,
      totalPurchases: purchaseCount,
    },
  });
}

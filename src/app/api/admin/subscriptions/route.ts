import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SIMULATE_PAYMENTS, getStripe } from '@/lib/stripe';
import { Role } from '@prisma/client';
import type Stripe from 'stripe';

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

  // Revenu total : données Stripe réelles ou fallback Prisma
  let totalRevenue = totalPurchaseRevenue._sum.amount || 0;

  if (!SIMULATE_PAYMENTS) {
    try {
      const stripeClient = getStripe();
      // Exclure les charges des admins
      const adminCustomerIds = new Set(
        (await prisma.user.findMany({
          where: { role: Role.ADMIN, stripeCustomerId: { not: null } },
          select: { stripeCustomerId: true },
        })).map(u => u.stripeCustomerId!)
      );

      let stripeTotal = 0;
      let hasMore = true;
      let startingAfter: string | undefined;

      while (hasMore) {
        const params: Record<string, unknown> = { limit: 100 };
        if (startingAfter) params.starting_after = startingAfter;

        const batch = await stripeClient.charges.list(params as Stripe.ChargeListParams);
        for (const charge of batch.data) {
          if (charge.status !== 'succeeded') continue;
          const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
          if (customerId && adminCustomerIds.has(customerId)) continue;
          const net = (charge.amount - (charge.amount_refunded ?? 0)) / 100;
          if (net > 0) stripeTotal += net;
        }
        hasMore = batch.has_more;
        if (batch.data.length > 0) {
          startingAfter = batch.data[batch.data.length - 1].id;
        }
      }

      totalRevenue = stripeTotal;
    } catch (e) {
      console.error('Stripe charges fetch failed, using Prisma fallback', e);
    }
  }

  return NextResponse.json({
    subscriptions,
    formationPurchases,
    courseRentals,
    stats: {
      monthlyActive: monthlySubs,
      annualActive: annualSubs,
      totalFormationPurchases: formationPurchases.length,
      formationRevenue: formationPurchases.reduce((sum, p) => sum + p.amount, 0),
      totalCourseRentals: courseRentals.length,
      courseRentalRevenue: courseRentals.reduce((sum, p) => sum + p.amount, 0),
      totalRevenue,
    },
    pagination: {
      page,
      limit,
      totalSubscriptions: subscriptionCount,
      totalPurchases: purchaseCount,
    },
  });
}

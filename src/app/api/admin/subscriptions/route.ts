import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Statistiques abonnements et achats
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const [
    subscriptions,
    purchases,
    monthlySubs,
    annualSubs,
    totalPurchaseRevenue,
  ] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchase.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        formation: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.subscription.count({
      where: { plan: 'MONTHLY', status: 'ACTIVE' },
    }),
    prisma.subscription.count({
      where: { plan: 'ANNUAL', status: 'ACTIVE' },
    }),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    subscriptions,
    purchases,
    stats: {
      monthlyActive: monthlySubs,
      annualActive: annualSubs,
      totalPurchases: totalPurchaseRevenue._count,
      purchaseRevenue: totalPurchaseRevenue._sum.amount || 0,
    },
  });
}

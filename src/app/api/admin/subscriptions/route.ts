import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.subscription.count(),
    prisma.purchase.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        formation: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.purchase.count(),
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

  // Séparer achats formations vs locations cours
  const formationPurchases = allPurchases.filter(p => p.formationId != null);
  const courseRentals = allPurchases.filter(p => p.courseId != null);

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
      totalRevenue: (totalPurchaseRevenue._sum.amount || 0),
    },
    pagination: {
      page,
      limit,
      totalSubscriptions: subscriptionCount,
      totalPurchases: purchaseCount,
    },
  });
}

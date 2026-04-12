import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Récupère les plans tarifaires
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const plans = await prisma.pricingPlan.findMany({
    orderBy: { slug: 'asc' },
  });

  return NextResponse.json(
    { plans },
    {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}

// PUT - Met à jour les plans tarifaires (prix + stripePriceId)
export async function PUT(req: Request) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();
  const { plans } = body;

  if (!Array.isArray(plans)) {
    return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
  }

  const allowedSlugs = ['monthly', 'annual'];

  for (const plan of plans) {
    if (!allowedSlugs.includes(plan.slug)) {
      return NextResponse.json({ error: `Slug invalide: ${plan.slug}` }, { status: 400 });
    }
    if (typeof plan.price !== 'number' || plan.price < 0) {
      return NextResponse.json({ error: 'Le prix doit être un nombre positif' }, { status: 400 });
    }
    if (typeof plan.stripePriceId !== 'string') {
      return NextResponse.json({ error: 'Le stripePriceId doit être une chaîne' }, { status: 400 });
    }
  }

  const updated = await Promise.all(
    plans.map((plan: { slug: string; price: number; stripePriceId: string; name?: string }) =>
      prisma.pricingPlan.update({
        where: { slug: plan.slug },
        data: {
          price: plan.price,
          stripePriceId: plan.stripePriceId,
          ...(plan.name ? { name: plan.name } : {}),
        },
      })
    )
  );

  revalidateTag('admin-dashboard', 'max');
  return NextResponse.json({ plans: updated });
}

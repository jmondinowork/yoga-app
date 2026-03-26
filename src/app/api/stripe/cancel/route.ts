import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SIMULATE_PAYMENTS, stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté.' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Aucun abonnement actif.' },
        { status: 400 }
      );
    }

    // ─── Mode simulation ───
    if (SIMULATE_PAYMENTS) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { cancelAtPeriodEnd: true },
      });

      return NextResponse.json({ success: true });
    }

    // ─── Mode Stripe réel ───
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[STRIPE_CANCEL_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

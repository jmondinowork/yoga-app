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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ─── Mode simulation ───
    if (SIMULATE_PAYMENTS) {
      return NextResponse.json({ url: `${baseUrl}/mon-espace/parametres` });
    }

    // ─── Mode Stripe réel ───
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun compte Stripe associé.' },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/mon-espace/parametres`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('[STRIPE_PORTAL_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { SIMULATE_PAYMENTS, stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// ─── Simulation : crée directement les enregistrements en base ───
async function handleSimulatedCheckout(
  type: string,
  planId: string | undefined,
  courseId: string | undefined,
  userId: string,
  baseUrl: string
) {
  // Abonnement simulé
  if (type === 'subscription') {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan introuvable.' }, { status: 400 });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (existingSub?.status === 'ACTIVE' && !existingSub.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.id === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan.id === 'annual' ? 'ANNUAL' : 'MONTHLY',
        status: 'ACTIVE',
        stripeSubscriptionId: `sim_sub_${crypto.randomUUID()}`,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: plan.id === 'annual' ? 'ANNUAL' : 'MONTHLY',
        status: 'ACTIVE',
        stripeSubscriptionId: `sim_sub_${crypto.randomUUID()}`,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      url: `${baseUrl}/mon-espace?success=true&type=subscription`,
    });
  }

  // Achat unitaire simulé
  if (type === 'course' || type === 'formation') {
    let item: { id: string; slug: string; price: number | null } | null = null;

    if (type === 'course') {
      item = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, slug: true, price: true },
      });
      if (!item) return NextResponse.json({ error: 'Cours introuvable.' }, { status: 404 });
    } else {
      item = await prisma.formation.findUnique({
        where: { id: courseId },
        select: { id: true, slug: true, price: true },
      });
      if (!item) return NextResponse.json({ error: 'Formation introuvable.' }, { status: 404 });
    }

    // Pour les cours : vérifier si une location active existe déjà
    if (type === 'course') {
      const existingRental = await prisma.purchase.findFirst({
        where: { userId, courseId: item.id, expiresAt: { gt: new Date() } },
      });
      if (existingRental) {
        return NextResponse.json(
          { error: 'Vous avez déjà une location active pour ce cours.' },
          { status: 400 }
        );
      }
    } else {
      const existingPurchase = await prisma.purchase.findFirst({
        where: { userId, formationId: item.id },
      });
      if (existingPurchase) {
        return NextResponse.json(
          { error: 'Vous avez déjà acheté cette formation.' },
          { status: 400 }
        );
      }
    }

    // Location 72h pour les cours, accès permanent pour les formations
    const expiresAt = type === 'course'
      ? new Date(Date.now() + 72 * 60 * 60 * 1000)
      : undefined;

    await prisma.purchase.create({
      data: {
        userId,
        ...(type === 'course' ? { courseId: item.id } : { formationId: item.id }),
        amount: item.price || 0,
        stripePaymentId: `sim_pay_${crypto.randomUUID()}`,
        ...(expiresAt ? { expiresAt } : {}),
      },
    });

    const successUrl =
      type === 'course'
        ? `${baseUrl}/cours/${item.slug}?success=true`
        : `${baseUrl}/formations/${item.slug}?success=true`;

    return NextResponse.json({ url: successUrl });
  }

  return NextResponse.json({ error: "Type d'achat invalide." }, { status: 400 });
}

// ─── Route principale ───
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour effectuer un achat.' },
        { status: 401 }
      );
    }

    // Rate limit : 10 tentatives de checkout par utilisateur par 15 min
    const rl = rateLimit(`checkout:${session.user.id}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await req.json();
    const { type, planId, courseId } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ─── Mode simulation ───
    if (SIMULATE_PAYMENTS) {
      return handleSimulatedCheckout(type, planId, courseId, user.id, baseUrl);
    }

    // ─── Mode Stripe réel ───

    // Créer ou récupérer le client Stripe
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Abonnement
    if (type === 'subscription') {
      const plan = PLANS.find((p) => p.id === planId);

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan introuvable.' },
          { status: 400 }
        );
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
          planId: plan.id,
        },
        success_url: `${baseUrl}/mon-espace?success=true&type=subscription`,
        cancel_url: `${baseUrl}/tarifs?canceled=true`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        locale: 'fr',
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    // Achat unitaire (cours ou formation)
    if (type === 'course' || type === 'formation') {
      let item;
      let itemName: string;
      let itemPrice: number;

      if (type === 'course') {
        item = await prisma.course.findUnique({
          where: { id: courseId },
        });

        if (!item) {
          return NextResponse.json(
            { error: 'Cours introuvable.' },
            { status: 404 }
          );
        }

        itemName = item.title;
        itemPrice = item.price ? Math.round(item.price * 100) : 0;
      } else {
        item = await prisma.formation.findUnique({
          where: { id: courseId },
        });

        if (!item) {
          return NextResponse.json(
            { error: 'Formation introuvable.' },
            { status: 404 }
          );
        }

        itemName = item.title;
        itemPrice = item.price ? Math.round(item.price * 100) : 0;
      }

      // Vérifier si déjà loué/acheté
      if (type === 'course') {
        const existingRental = await prisma.purchase.findFirst({
          where: { userId: user.id, courseId: item.id, expiresAt: { gt: new Date() } },
        });
        if (existingRental) {
          return NextResponse.json(
            { error: 'Vous avez déjà une location active pour ce cours.' },
            { status: 400 }
          );
        }
      } else {
        const existingPurchase = await prisma.purchase.findFirst({
          where: { userId: user.id, formationId: item.id },
        });
        if (existingPurchase) {
          return NextResponse.json(
            { error: 'Vous avez déjà acheté cette formation.' },
            { status: 400 }
          );
        }
      }

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: itemName,
                description:
                  type === 'course'
                    ? `Location 72h du cours "${itemName}"`
                    : `Accès illimité à la formation "${itemName}"`,
              },
              unit_amount: itemPrice,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
          type,
          itemId: item.id,
        },
        success_url: `${baseUrl}/mon-espace?success=true&type=${type}`,
        cancel_url: `${baseUrl}/${type === 'course' ? 'cours' : 'formations'}/${item.slug}?canceled=true`,
        locale: 'fr',
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json(
      { error: 'Type d\'achat invalide.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      const messages: Record<string, string> = {
        card_declined: 'Votre carte a été refusée.',
        insufficient_funds: 'Fonds insuffisants.',
        expired_card: 'Votre carte a expiré.',
        incorrect_cvc: 'Le code CVC est incorrect.',
        processing_error: 'Erreur de traitement, veuillez réessayer.',
      };
      const message = messages[error.code || ''] || error.message || 'Paiement refusé.';
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      console.error('[STRIPE_CHECKOUT_INVALID_REQUEST]', error.message);
      return NextResponse.json(
        { error: 'Requête de paiement invalide.' },
        { status: 400 }
      );
    }

    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

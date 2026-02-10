import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour effectuer un achat.' },
        { status: 401 }
      );
    }

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

        if (item.isFree) {
          return NextResponse.json(
            { error: 'Ce cours est gratuit.' },
            { status: 400 }
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

      // Vérifier si déjà acheté
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          ...(type === 'course'
            ? { courseId: item.id }
            : { formationId: item.id }),
        },
      });

      if (existingPurchase) {
        return NextResponse.json(
          { error: 'Vous avez déjà acheté cet élément.' },
          { status: 400 }
        );
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
                    ? `Accès illimité au cours "${itemName}"`
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
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, SIMULATE_PAYMENTS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper: récupérer les dates de période depuis les items d'un abonnement
async function getSubscriptionPeriod(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data'],
  });
  const item = sub.items.data[0];
  return {
    start: item ? new Date(item.current_period_start * 1000) : new Date(),
    end: item ? new Date(item.current_period_end * 1000) : new Date(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    status: sub.status,
  };
}

export async function POST(req: NextRequest) {
  if (SIMULATE_PAYMENTS) {
    return NextResponse.json({ error: 'Webhooks désactivés en mode simulation.' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET non configuré.' }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[STRIPE_WEBHOOK_SIGNATURE_ERROR]', err);
    return NextResponse.json(
      { error: 'Signature invalide.' },
      { status: 400 }
    );
  }

  // Idempotence atomique : ignorer les événements déjà traités
  try {
    await prisma.stripeEvent.create({ data: { id: event.id } });
  } catch (err: unknown) {
    // P2002 = unique constraint violation → événement déjà traité
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ received: true });
    }
    throw err;
  }

  try {
    switch (event.type) {
      // ─── Paiement unitaire réussi ───
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, type, itemId, planId } = session.metadata || {};

        if (!userId) break;

        // Achat unitaire
        if (type === 'course' || type === 'formation') {
          // Location 72h pour les cours, accès permanent pour les formations
          const expiresAt = type === 'course'
            ? new Date(Date.now() + 72 * 60 * 60 * 1000)
            : undefined;

          await prisma.purchase.create({
            data: {
              userId,
              ...(type === 'course'
                ? { courseId: itemId }
                : { formationId: itemId }),
              amount: (session.amount_total || 0) / 100,
              stripePaymentId: session.payment_intent as string,
              ...(expiresAt ? { expiresAt } : {}),
            },
          });
        }

        // Nouvel abonnement
        if (session.mode === 'subscription' && planId) {
          const subscriptionId = session.subscription as string;
          const period = await getSubscriptionPeriod(subscriptionId);

          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscriptionId },
            create: {
              userId,
              plan: planId === 'annual' ? 'ANNUAL' : 'MONTHLY',
              status: 'ACTIVE',
              stripeSubscriptionId: subscriptionId,
              currentPeriodStart: period.start,
              currentPeriodEnd: period.end,
            },
            update: {
              status: 'ACTIVE',
              plan: planId === 'annual' ? 'ANNUAL' : 'MONTHLY',
              currentPeriodStart: period.start,
              currentPeriodEnd: period.end,
            },
          });
        }

        break;
      }

      // ─── Facture payée (renouvellement) ───
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const parentDetails = invoice.parent?.subscription_details;
        const subscriptionRef = parentDetails?.subscription;

        if (!subscriptionRef) break;

        const subscriptionId =
          typeof subscriptionRef === 'string'
            ? subscriptionRef
            : subscriptionRef.id;

        const period = await getSubscriptionPeriod(subscriptionId);

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
          },
        });

        break;
      }

      // ─── Paiement échoué ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const parentDetails = invoice.parent?.subscription_details;
        const subscriptionRef = parentDetails?.subscription;

        if (!subscriptionRef) break;

        const subscriptionId =
          typeof subscriptionRef === 'string'
            ? subscriptionRef
            : subscriptionRef.id;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            status: 'PAST_DUE',
          },
        });

        break;
      }

      // ─── Abonnement mis à jour ───
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const statusMap: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED'> = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          unpaid: 'PAST_DUE',
          trialing: 'ACTIVE',
          incomplete: 'PAST_DUE',
          incomplete_expired: 'CANCELED',
          paused: 'CANCELED',
        };

        const item = subscription.items.data[0];
        const updateData: Record<string, unknown> = {
          status: statusMap[subscription.status] || 'ACTIVE',
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };

        if (item) {
          updateData.currentPeriodStart = new Date(
            item.current_period_start * 1000
          );
          updateData.currentPeriodEnd = new Date(
            item.current_period_end * 1000
          );
        }

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: updateData,
        });

        break;
      }

      // ─── Abonnement supprimé ───
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            cancelAtPeriodEnd: false,
          },
        });

        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Événement non géré : ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE_WEBHOOK_HANDLER_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook.' },
      { status: 500 }
    );
  }
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { db } from '@/lib/db';
import { creditTransactions, payments, users } from '@/lib/db/schema';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { getCreditPackage } from '@/lib/stripe/packages';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      {
        error: 'invalid_signature',
        message: '缺少 Stripe 签名',
      },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const webhookSecret = getStripeWebhookSecret();
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      {
        error: 'invalid_signature',
        message: 'Stripe 签名验证失败',
      },
      { status: 400 },
    );
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripeSessionId = session.id;
  const userId = session.metadata?.userId;
  const packageId = session.metadata?.packageId;
  const creditPackage = packageId ? getCreditPackage(packageId) : null;

  if (!userId || !creditPackage) {
    throw new Error('Missing checkout session metadata');
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(payments)
      .values({
        userId,
        stripeSessionId,
        stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        amountCents: session.amount_total ?? creditPackage.amountCents,
        currency: session.currency ?? 'usd',
        creditsPurchased: creditPackage.credits,
        status: 'pending',
      })
      .onConflictDoNothing({
        target: payments.stripeSessionId,
      });

    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.stripeSessionId, stripeSessionId))
      .for('update')
      .limit(1);

    if (!payment || payment.status === 'completed') {
      return;
    }

    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update').limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const newBalance = user.credits + creditPackage.credits;

    await tx.update(users).set({ credits: newBalance, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx
      .update(payments)
      .set({
        stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : payment.stripePaymentIntent,
        amountCents: session.amount_total ?? payment.amountCents,
        currency: session.currency ?? payment.currency,
        creditsPurchased: creditPackage.credits,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
    await tx.insert(creditTransactions).values({
      userId,
      amount: creditPackage.credits,
      type: 'purchase',
      balanceAfter: newBalance,
      referenceId: payment.id,
      description: `Stripe 充值 ${creditPackage.name}`,
    });
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;

  if (!checkoutSessionId) {
    return;
  }

  await db
    .update(payments)
    .set({
      stripePaymentIntent: paymentIntent.id,
      status: 'failed',
    })
    .where(eq(payments.stripeSessionId, checkoutSessionId));
}

import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/currentUser';
import { db } from '@/lib/db';
import { payments, users } from '@/lib/db/schema';
import { getStripe } from '@/lib/stripe';
import { getCreditPackage } from '@/lib/stripe/packages';

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  packageId: z.enum(['starter', 'standard', 'premium']),
});

function getAppOrigin(request: Request) {
  return process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request).catch(() => null);

  if (!currentUser) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = checkoutSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: 'invalid_params',
        message: 'Invalid credit package',
      },
      { status: 400 },
    );
  }

  const creditPackage = getCreditPackage(parsedBody.data.packageId);
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      {
        error: 'not_found',
        message: 'User not found',
      },
      { status: 404 },
    );
  }

  let stripe;

  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      {
        error: 'stripe_not_configured',
        message: 'Stripe is not configured',
      },
      { status: 503 },
    );
  }

  const origin = getAppOrigin(request);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing/cancel`,
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: creditPackage.name,
            description: creditPackage.description,
          },
          unit_amount: creditPackage.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      packageId: creditPackage.id,
      credits: String(creditPackage.credits),
    },
  });

  await db.insert(payments).values({
    userId: user.id,
    stripeSessionId: session.id,
    stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amountCents: creditPackage.amountCents,
    creditsPurchased: creditPackage.credits,
    status: 'pending',
  });

  return NextResponse.json({
    checkoutUrl: session.url,
  });
}

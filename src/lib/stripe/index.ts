import Stripe from 'stripe';

let stripeClient: Stripe | undefined;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);

  return stripeClient;
}

export function getStripeWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  return process.env.STRIPE_WEBHOOK_SECRET;
}

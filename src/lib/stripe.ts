import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)
// src/lib/stripe-admin.ts — Slice 7B-2: Admin billing operations
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripeAdmin(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key, { apiVersion: '2025-12-15.clover' as any } as any)
}

interface BillingContext {
  adminUserId: string
  targetUserId: string
  reason: string
}

async function logBillingOverride(
  ctx: BillingContext,
  overrideType: string,
  stripeActionId: string | null,
  amountPence: number | null,
  before: object,
  after: object
) {
  const supabase = await createClient()
  await supabase.from('billing_overrides').insert({
    admin_user_id: ctx.adminUserId,
    target_user_id: ctx.targetUserId,
    override_type: overrideType,
    stripe_action_id: stripeActionId,
    amount_pence: amountPence,
    reason: ctx.reason,
    before_snapshot: before,
    after_snapshot: after,
  })
  await supabase.from('admin_audit_log').insert({
    admin_user_id: ctx.adminUserId,
    action_type: `billing_${overrideType}`,
    target_user_id: ctx.targetUserId,
    details: { stripe_action_id: stripeActionId, reason: ctx.reason },
  })
}

export async function changeTier(
  ctx: BillingContext,
  subscriptionId: string,
  newPriceId: string
) {
  const stripe = getStripeAdmin()
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const before = { status: sub.status, price_id: sub.items.data[0]?.price.id }
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: sub.items.data[0].id, price: newPriceId }],
    proration_behavior: 'create_prorations',
  } as any, { idempotencyKey: `tier-${ctx.targetUserId}-${Date.now()}` })
  const after = { status: updated.status, price_id: newPriceId }
  await logBillingOverride(ctx, 'tier_change', subscriptionId, null, before, after)
  return updated
}

export async function applyDiscount(
  ctx: BillingContext,
  subscriptionId: string,
  percentOff: number,
  durationMonths: number
) {
  const stripe = getStripeAdmin()
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'repeating',
    duration_in_months: durationMonths,
    name: `Admin discount - ${ctx.reason.slice(0, 40)}`,
  }, { idempotencyKey: `discount-${ctx.targetUserId}-${Date.now()}` })
  const updated = await stripe.subscriptions.update(subscriptionId, { discounts: [{ coupon: coupon.id }] } as any)
  await logBillingOverride(ctx, 'discount', coupon.id, null, {}, { percent_off: percentOff, duration_months: durationMonths })
  return updated
}

export async function cancelSubscription(
  ctx: BillingContext,
  subscriptionId: string,
  atPeriodEnd: boolean = true
) {
  const stripe = getStripeAdmin()
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const before = { status: sub.status }
  let result: any
  if (atPeriodEnd) {
    result = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
  } else {
    result = await stripe.subscriptions.cancel(subscriptionId)
  }
  const after = { status: result.status }
  await logBillingOverride(ctx, 'cancel', subscriptionId, null, before, after)
  return result
}

export async function issueRefund(
  ctx: BillingContext,
  chargeId: string,
  amountPence: number
) {
  const stripe = getStripeAdmin()
  const refund = await stripe.refunds.create({
    charge: chargeId,
    amount: amountPence,
  }, { idempotencyKey: `refund-${ctx.targetUserId}-${chargeId}-${amountPence}` })
  await logBillingOverride(ctx, 'refund', refund.id, amountPence, { charge_id: chargeId }, { status: refund.status, amount: amountPence })
  return refund
}

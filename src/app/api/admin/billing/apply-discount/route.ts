// src/app/api/admin/billing/apply-discount/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyDiscount } from '@/lib/stripe-admin'
import { isAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { target_user_id, subscription_id, percent_off, duration_months, reason } = await req.json()
    if (!target_user_id || !subscription_id || !percent_off || !duration_months || !reason || reason.length < 10)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const result = await applyDiscount({ adminUserId: user.id, targetUserId: target_user_id, reason }, subscription_id, percent_off, duration_months)
    return NextResponse.json({ ok: true, subscription: result.id })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

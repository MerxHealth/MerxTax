// src/app/api/admin/billing/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { issueRefund } from '@/lib/stripe-admin'
import { isAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { target_user_id, charge_id, amount_pence, reason } = await req.json()
    if (!target_user_id || !charge_id || !amount_pence || !reason || reason.length < 10)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const result = await issueRefund({ adminUserId: user.id, targetUserId: target_user_id, reason }, charge_id, amount_pence)
    return NextResponse.json({ ok: true, refund_id: result.id, status: result.status })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

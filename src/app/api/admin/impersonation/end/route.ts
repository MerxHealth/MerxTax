// src/app/api/admin/impersonation/end/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { session_id, reason = 'manual' } = body
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const { error } = await supabase
      .from('impersonation_sessions')
      .update({ ended_at: new Date().toISOString(), end_reason: reason })
      .eq('id', session_id)
      .eq('admin_user_id', user.id)
      .is('ended_at', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'impersonation_end',
      details: { session_id, reason },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// src/app/api/admin/impersonation/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { target_user_id, reason } = body
    if (!target_user_id || !reason || reason.length < 10) {
      return NextResponse.json({ error: 'target_user_id and reason (min 10 chars) required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '0.0.0.0'
    const userAgent = req.headers.get('user-agent') ?? ''
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Use admin client so RLS doesn't block insert into impersonation_sessions
    const adminDb = createAdminClient()
    const { data: session, error } = await adminDb
      .from('impersonation_sessions')
      .insert({
        admin_user_id: user.id,
        target_user_id,
        expires_at: expiresAt,
        start_ip: ip,
        start_user_agent: userAgent,
        start_reason: reason,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await adminDb.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'impersonation_start',
      target_user_id,
      details: { session_id: session.id, reason, expires_at: expiresAt },
    })

    return NextResponse.json({ session_id: session.id, expires_at: expiresAt })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// src/app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const plan = searchParams.get('plan') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const offset = (page - 1) * limit

    let query = adminDb
      .from('profiles')
      .select('id, full_name, email, plan, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (plan) {
      query = query.eq('plan', plan)
    }

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clients: data ?? [], total: count ?? 0, page, limit })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

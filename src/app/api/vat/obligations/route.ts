import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: connection } = await supabase
      .from('hmrc_connections')
      .select('access_token, vrn')
      .eq('user_id', user.id)
      .single()

    if (!connection?.access_token) {
      return NextResponse.json({ error: 'HMRC not connected' }, { status: 400 })
    }

    if (!connection?.vrn) {
      return NextResponse.json({ error: 'VAT number not set' }, { status: 400 })
    }

    const from = '2024-01-01'
    const to = '2025-12-31'

    const res = await fetch(
      `${process.env.HMRC_BASE_URL}/organisations/vat/${connection.vrn}/obligations?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          Accept: 'application/vnd.hmrc.1.0+json',
        },
      }
    )

    const data = await res.json()
    return NextResponse.json(data)

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
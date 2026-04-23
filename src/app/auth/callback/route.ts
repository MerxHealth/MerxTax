import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=hmrc_denied`)
  }

  const storedState = request.cookies.get('hmrc_oauth_state')?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=no_code`)
  }

  const tokenRes = await fetch(`${process.env.HMRC_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.HMRC_REDIRECT_URI!,
      client_id: process.env.HMRC_CLIENT_ID!,
      client_secret: process.env.HMRC_CLIENT_SECRET!,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return NextResponse.redirect(`${appUrl}/dashboard?error=token_exchange_failed&detail=${encodeURIComponent(err)}`)
  }

  const tokens = await tokenRes.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.from('hmrc_connections').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope,
    }, { onConflict: 'user_id' })
  }

  const response = NextResponse.redirect(`${appUrl}/dashboard?connected=true`)
  response.cookies.delete('hmrc_oauth_state')
  return response
}
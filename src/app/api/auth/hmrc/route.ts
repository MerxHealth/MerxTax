import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const state = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.HMRC_CLIENT_ID!,
    scope: 'read:vat write:vat',
    redirect_uri: process.env.HMRC_REDIRECT_URI!,
    state,
  })

  const authUrl = `${process.env.HMRC_BASE_URL}/oauth/authorize?${params}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('hmrc_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    sameSite: 'lax',
  })

  return response
}
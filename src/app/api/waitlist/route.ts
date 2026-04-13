import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, language } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('waitlist')
      .insert({
        name: name || null,
        email: email.toLowerCase().trim(),
        language: language || 'en',
      })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'already_registered' })
      }
      console.error('Waitlist insert error:', error)
      return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Waitlist route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
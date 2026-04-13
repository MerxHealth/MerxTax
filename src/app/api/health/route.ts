import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Just test the connection with a lightweight query
    const { error } = await supabase.rpc('version')
    return NextResponse.json({ 
      ok: true, 
      message: 'Supabase connected successfully' 
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
import { createBrowserClient } from '@supabase/ssr'

function createDeferredClient() {
  return new Proxy(
    {},
    {
      get() {
        return () => {
          throw new Error('Supabase client is not configured')
        }
      },
    }
  ) as ReturnType<typeof createBrowserClient>
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      return createDeferredClient()
    }

    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured')
  }

  return createBrowserClient(url, anonKey)
}

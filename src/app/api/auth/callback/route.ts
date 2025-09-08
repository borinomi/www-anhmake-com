import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    redirect(`${origin}/?error=no_code`)
  }

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Session exchange error:', error)
      redirect(`${origin}/?error=auth_failed`)
    }

    // Handle forwarded host for production deployments (like Vercel)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    if (isLocalEnv) {
      redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      redirect(`https://${forwardedHost}${next}`)
    } else {
      redirect(`${origin}${next}`)
    }
  } catch (error) {
    console.error('Callback error:', error)
    redirect(`${origin}/?error=callback_failed`)
  }
}
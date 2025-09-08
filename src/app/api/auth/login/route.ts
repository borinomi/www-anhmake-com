import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { origin } = new URL(request.url)
  
  try {
    // Handle forwarded host for production deployments (like Vercel)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    let redirectTo: string
    if (isLocalEnv) {
      redirectTo = `${origin}/api/auth/callback`
    } else if (forwardedHost) {
      redirectTo = `https://${forwardedHost}/api/auth/callback`
    } else {
      redirectTo = `${origin}/api/auth/callback`
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    })

    if (error) {
      console.error('Auth error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (data.url) {
      return NextResponse.redirect(data.url)
    }

    return new Response(JSON.stringify({ error: 'No auth URL returned' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Login error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
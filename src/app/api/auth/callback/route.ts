import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const origin = request.nextUrl.origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (!code) {
    redirect(`${siteUrl}/?error=no_code`)
  }

  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Session exchange error:', error)
      redirect(`${siteUrl}/?error=auth_failed`)
    }

    redirect(siteUrl)
  } catch (error) {
    console.error('Callback error:', error)
    redirect(`${siteUrl}/?error=callback_failed`)
  }
}
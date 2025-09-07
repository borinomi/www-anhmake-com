const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Session exchange error:', error);
      return res.redirect('/?error=auth_failed');
    }

    if (!session) {
      return res.redirect('/?error=no_session');
    }

    // Set session cookies
    const { access_token, refresh_token } = session;
    
    // Set httpOnly cookies for security
    res.setHeader('Set-Cookie', [
      `sb-access-token=${access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      `sb-refresh-token=${refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}` // 7 days
    ]);

    // Redirect back to main page
    return res.redirect('/');
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('/?error=callback_failed');
  }
};
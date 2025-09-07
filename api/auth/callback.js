const { createServerClient } = require('@supabase/ssr');

module.exports = async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('https://www.anhmake.com/?error=no_code');
  }

  try {
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) return [];
            
            return cookieHeader.split(';').map(cookie => {
              const [name, value] = cookie.trim().split('=');
              return { name, value };
            });
          },
          setAll(cookiesToSet) {
            const cookieStrings = cookiesToSet.map(({ name, value, options }) => {
              let cookieString = `${name}=${value}`;
              
              if (options?.httpOnly) cookieString += '; HttpOnly';
              if (options?.secure) cookieString += '; Secure';
              if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`;
              if (options?.path) cookieString += `; Path=${options.path}`;
              if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
              
              return cookieString;
            });
            
            res.setHeader('Set-Cookie', cookieStrings);
          },
        },
      }
    );

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Session exchange error:', error);
      return res.redirect('https://www.anhmake.com/?error=auth_failed');
    }

    // Redirect back to main page
    return res.redirect('https://www.anhmake.com/');
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('https://www.anhmake.com/?error=callback_failed');
  }
};
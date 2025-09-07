const { createServerClient } = require('@supabase/ssr');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Get current user from session cookies
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Return user info
    return res.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url
    });

  } catch (error) {
    console.error('User check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
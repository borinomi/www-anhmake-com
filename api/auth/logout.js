module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear cookies
    res.setHeader('Set-Cookie', [
      'sb-access-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'sb-refresh-token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
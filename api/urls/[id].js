const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'URL ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/urls/123
async function handleGet(req, res, id) {
  const { data: urlData, error: urlError } = await supabase
    .from('urls')
    .select('*')
    .eq('id', id)
    .single();

  if (urlError) {
    if (urlError.code === 'PGRST116') {
      return res.status(404).json({ error: 'URL not found' });
    }
    console.error('URL fetch error:', urlError);
    return res.status(500).json({ error: 'Failed to fetch URL' });
  }

  return res.status(200).json(urlData);
}

// PUT /api/urls/123
async function handlePut(req, res, id) {
  const { title, url, description, icon } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required' });
  }

  const { data, error } = await supabase
    .from('urls')
    .update({
      title: title,
      url: url,
      description: description || '',
      icon: icon || 'logo_link.png',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('URL update error:', error);
    return res.status(500).json({ error: 'Failed to update URL' });
  }

  return res.status(200).json(data);
}

// DELETE /api/urls/123
async function handleDelete(req, res, id) {
  const { error } = await supabase
    .from('urls')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('URL delete error:', error);
    return res.status(500).json({ error: 'Failed to delete URL' });
  }

  return res.status(200).json({ success: true, message: 'URL deleted successfully' });
}
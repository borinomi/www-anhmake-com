const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res, id);
      case 'DELETE':
        return await handleDelete(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/urls?section_id=xxx OR /api/urls?card_id=xxx
async function handleGet(req, res) {
  const { section_id, card_id } = req.query;

  if (!section_id && !card_id) {
    return res.status(400).json({ error: 'Either section_id or card_id is required' });
  }

  let query = supabase.from('urls').select('*');
  
  if (section_id) {
    query = query.eq('section_id', section_id).is('card_id', null);
  } else if (card_id) {
    query = query.eq('card_id', card_id).is('section_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    console.error('URLs fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch URLs' });
  }

  return res.status(200).json(data || []);
}

// POST /api/urls
async function handlePost(req, res) {
  const { section_id, card_id, title, url, description, icon } = req.body;

  // Validation
  if (!title || !url) {
    return res.status(400).json({ error: 'title and url are required' });
  }

  if (!section_id && !card_id) {
    return res.status(400).json({ error: 'Either section_id or card_id is required' });
  }

  if (section_id && card_id) {
    return res.status(400).json({ error: 'Cannot specify both section_id and card_id' });
  }

  const urlData = {
    section_id: section_id || null,
    card_id: card_id ? parseInt(card_id) : null,
    title: title,
    url: url,
    description: description || '',
    icon: icon || 'logo_link.png'
  };

  const { data, error } = await supabase
    .from('urls')
    .insert([urlData])
    .select()
    .single();

  if (error) {
    console.error('URL insert error:', error);
    return res.status(500).json({ error: 'Failed to create URL' });
  }

  return res.status(201).json(data);
}

// PUT /api/urls/123
async function handlePut(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'URL ID is required' });
  }

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
  if (!id) {
    return res.status(400).json({ error: 'URL ID is required' });
  }

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
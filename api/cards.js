const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/cards?section_id=xxx
async function handleGet(req, res) {
  const { section_id } = req.query;
  
  if (!section_id) {
    return res.status(400).json({ error: 'section_id is required' });
  }
  
  const query = supabase.from('cards').select('*').eq('section_id', section_id);
  
  const { data, error } = await query.order('created_at', { ascending: true });
  
  if (error) {
    console.error('Cards fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch cards' });
  }
  
  return res.status(200).json(data || []);
}

// POST /api/cards - Unified card creation
async function handlePost(req, res) {
  try {
    const { section_id, title, description, icon, type, url, created_at } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    if (!section_id) {
      return res.status(400).json({ error: 'section_id is required' });
    }
    
    // URL validation for URL type cards
    if (type === 'url' && !url) {
      return res.status(400).json({ error: 'URL is required for URL type cards' });
    }

    // Prepare data for insertion with unified fields
    const cardDataToInsert = {
      section_id: section_id,
      title: title,
      description: description,
      icon: icon || 'logo.png',
      type: type || 'dashboard',
      url: type === 'url' ? url : null,
      created_at: created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cards')
      .insert([cardDataToInsert])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to insert card into Supabase.' });
    }

    return res.status(201).json({ success: true, message: 'Card saved to Supabase.', data: data });

  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

// PUT /api/cards/{id} or /api/cards
async function handlePut(req, res) {
  const { id, title, description, icon, type, url } = req.body;
  
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required' });
  }
  
  const updateData = {
    title,
    description,
    icon: icon || 'logo.png',
    type: type || 'dashboard',
    url: type === 'url' ? url : null,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('cards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Card update error:', error);
    return res.status(500).json({ error: 'Failed to update card' });
  }
  
  return res.status(200).json(data);
}

// DELETE /api/cards
async function handleDelete(req, res) {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Card delete error:', error);
    return res.status(500).json({ error: 'Failed to delete card' });
  }
  
  return res.status(200).json({ success: true, message: 'Card deleted successfully' });
}
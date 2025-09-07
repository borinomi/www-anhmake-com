const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Card ID is required' });
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

// GET /api/cards/123
async function handleGet(req, res, id) {
  const { data: cardData, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single();

  if (cardError) {
    if (cardError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Card not found' });
    }
    console.error('Card fetch error:', cardError);
    return res.status(500).json({ error: 'Failed to fetch card' });
  }

  return res.status(200).json(cardData);
}

// PUT /api/cards/123
async function handlePut(req, res, id) {
  const { title, description, icon, type, url } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const updateData = {
    title,
    description: description || '',
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

// DELETE /api/cards/123
async function handleDelete(req, res, id) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete card' });
  }

  return res.status(200).json({ success: true, message: 'Card deleted successfully' });
}
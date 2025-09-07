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

// GET /api/code-snippets?card_id=xxx
async function handleGet(req, res) {
  const { card_id } = req.query;
  
  if (!card_id) {
    return res.status(400).json({ error: 'card_id is required' });
  }
  
  const { data, error } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('card_id', card_id)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Code snippets fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch code snippets' });
  }
  
  return res.status(200).json(data || []);
}

// POST /api/code-snippets
async function handlePost(req, res) {
  const { card_id, title, content } = req.body;
  
  if (!card_id || !title || !content) {
    return res.status(400).json({ error: 'card_id, title and content are required' });
  }
  
  const { data, error } = await supabase
    .from('code_snippets')
    .insert([{
      card_id: card_id,
      title: title,
      content: content,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Code snippet insert error:', error);
    return res.status(500).json({ error: 'Failed to create code snippet' });
  }
  
  return res.status(201).json(data);
}

// PUT /api/code-snippets
async function handlePut(req, res) {
  const { id, title, content } = req.body;
  
  if (!id || !title || !content) {
    return res.status(400).json({ error: 'id, title and content are required' });
  }
  
  const { data, error } = await supabase
    .from('code_snippets')
    .update({
      title: title,
      content: content,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Code snippet update error:', error);
    return res.status(500).json({ error: 'Failed to update code snippet' });
  }
  
  return res.status(200).json(data);
}

// DELETE /api/code-snippets
async function handleDelete(req, res) {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  
  const { error } = await supabase
    .from('code_snippets')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Code snippet delete error:', error);
    return res.status(500).json({ error: 'Failed to delete code snippet' });
  }
  
  return res.status(200).json({ success: true, message: 'Code snippet deleted successfully' });
}
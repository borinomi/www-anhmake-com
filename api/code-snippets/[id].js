const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Code snippet ID is required' });
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

// GET /api/code-snippets/123
async function handleGet(req, res, id) {
  const { data: snippetData, error: snippetError } = await supabase
    .from('code_snippets')
    .select('*')
    .eq('id', id)
    .single();

  if (snippetError) {
    if (snippetError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Code snippet not found' });
    }
    console.error('Code snippet fetch error:', snippetError);
    return res.status(500).json({ error: 'Failed to fetch code snippet' });
  }

  return res.status(200).json(snippetData);
}

// PUT /api/code-snippets/123
async function handlePut(req, res, id) {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
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

// DELETE /api/code-snippets/123
async function handleDelete(req, res, id) {
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
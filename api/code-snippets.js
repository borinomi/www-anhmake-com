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

// GET /api/code-snippets?card_id=xxx OR /api/code-snippets?section_id=xxx OR /api/code-snippets/id
async function handleGet(req, res) {
  const { card_id, section_id, id } = req.query;
  
  // If ID is provided, get single snippet
  if (id) {
    const { data: snippetData, error: snippetError } = await supabase
      .from('code_snippets')
      .select('*')
      .eq('id', id)
      .single();

    if (snippetError) {
      if (snippetError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Code snippet not found' });
      }
      console.error('Snippet fetch error:', snippetError);
      return res.status(500).json({ error: 'Failed to fetch code snippet' });
    }

    return res.status(200).json(snippetData);
  }

  if (!card_id && !section_id) {
    return res.status(400).json({ error: 'Either card_id or section_id is required' });
  }

  let cardData = null;
  
  // If card_id is provided, get card information
  if (card_id) {
    const { data, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', card_id)
      .single();

    if (cardError) {
      console.error('Card fetch error:', cardError);
      return res.status(404).json({ error: 'Card not found' });
    }
    cardData = data;
  }

  // Get code snippets based on parent type
  let query = supabase.from('code_snippets').select('*');
  
  if (card_id) {
    query = query.eq('card_id', card_id).is('section_id', null);
  } else if (section_id) {
    query = query.eq('section_id', section_id).is('card_id', null);
  }

  const { data: snippetsData, error: snippetsError } = await query
    .order('created_at', { ascending: true });

  if (snippetsError) {
    console.error('Snippets fetch error:', snippetsError);
    return res.status(500).json({ error: 'Failed to fetch code snippets' });
  }

  return res.status(200).json({
    card: cardData, // Will be null for section-level snippets
    snippets: snippetsData || []
  });
}

// POST /api/code-snippets
async function handlePost(req, res) {
  const { card_id, section_id, title, content, icon } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  if (!card_id && !section_id) {
    return res.status(400).json({ error: 'Either card_id or section_id is required' });
  }

  if (card_id && section_id) {
    return res.status(400).json({ error: 'Cannot specify both card_id and section_id' });
  }

  const snippetData = {
    card_id: card_id ? parseInt(card_id) : null,
    section_id: section_id || null,
    title: title,
    content: content,
    icon: icon || 'logo_code.png'
  };

  const { data, error } = await supabase
    .from('code_snippets')
    .insert([snippetData])
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    return res.status(500).json({ error: 'Failed to create code snippet' });
  }

  return res.status(201).json(data);
}

// PUT /api/code-snippets/123
async function handlePut(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'Snippet ID is required' });
  }

  const { title, content, icon } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const updateData = {
    title: title,
    content: content,
    updated_at: new Date().toISOString()
  };

  if (icon) {
    updateData.icon = icon;
  }

  const { data, error } = await supabase
    .from('code_snippets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Failed to update code snippet' });
  }

  return res.status(200).json(data);
}

// DELETE /api/code-snippets/123
async function handleDelete(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'Snippet ID is required' });
  }

  const { error } = await supabase
    .from('code_snippets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete code snippet' });
  }

  return res.status(200).json({ success: true, message: 'Code snippet deleted successfully' });
}
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
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

// GET /api/sections
async function handleGet(req, res) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('section_order', { ascending: true });
  
  if (error) {
    console.error('Sections fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch sections' });
  }
  
  return res.status(200).json(data || []);
}

// POST /api/sections  
async function handlePost(req, res) {
  const { id, title, section_order } = req.body;
  
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required' });
  }
  
  const { data, error } = await supabase
    .from('sections')
    .insert([{ id, title, section_order: section_order || 1 }])
    .select()
    .single();
  
  if (error) {
    console.error('Section insert error:', error);
    return res.status(500).json({ error: 'Failed to create section' });
  }
  
  return res.status(201).json(data);
}

// PUT /api/sections
async function handlePut(req, res) {
  const { id, title, section_order } = req.body;
  
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required' });
  }
  
  const { data, error } = await supabase
    .from('sections')
    .update({ title, section_order })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Section update error:', error);
    return res.status(500).json({ error: 'Failed to update section' });
  }
  
  return res.status(200).json(data);
}

// DELETE /api/sections
async function handleDelete(req, res) {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Section delete error:', error);
    return res.status(500).json({ error: 'Failed to delete section' });
  }
  
  return res.status(200).json({ success: true, message: 'Section deleted successfully' });
}
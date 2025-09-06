import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import fs from 'fs/promises'; // Keep fs for now, might be needed for other operations later, or remove if not used
import path from 'path'; // Keep path for now

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('section_id', section_id)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Cards fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch cards' });
  }
  
  return res.status(200).json(data || []);
}

// POST /api/cards
async function handlePost(req, res) {
  try {
    const { section_id, title, description, icon, created_at } = req.body;

    // Basic validation for dashboard cards
    if (!section_id || !title || !description) {
      return res.status(400).json({ error: 'Missing required dashboard card fields.' });
    }

    // Prepare data for insertion into 'cards' table (dashboard only)
    const cardDataToInsert = {
      section_id: section_id,
      title: title,
      description: description,
      icon: icon || 'logo.png',
      created_at: created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cards')
      .insert([cardDataToInsert])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to insert dashboard card into Supabase.' });
    }

    return res.status(201).json({ success: true, message: 'Dashboard card saved to Supabase.', data: data });

  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
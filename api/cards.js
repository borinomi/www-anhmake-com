import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import fs from 'fs/promises'; // Keep fs for now, might be needed for other operations later, or remove if not used
import path from 'path'; // Keep path for now

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id, section_id, title, description, icon, created_at } = req.body;

    // Basic validation for dashboard cards
    if (!id || !section_id || !title || !description) {
      return res.status(400).json({ error: 'Missing required dashboard card fields.' });
    }

    // Prepare data for insertion into 'cards' table (dashboard only)
    const cardDataToInsert = {
      id: id,
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
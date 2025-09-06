import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises'; // Keep fs/path for now, might be needed for other operations later, or remove if not used
import path from 'path';

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Handle POST request for creating a new page/dashboard
  if (req.method === 'POST') {
    try {
      const { dashboardId, title, description, icon, parentId, sectionsData } = req.body; // dashboardId is the page ID

      if (!dashboardId || !title || !description) {
        return res.status(400).json({ error: 'dashboardId, title, and description are required.' });
      }

      // Validate dashboardId
      if (!/^[a-z0-9-]+$/.test(dashboardId)) {
          return res.status(400).json({ error: 'Invalid dashboardId. Only lowercase letters, numbers, and hyphens are allowed.' });
      }

      // Prepare data for insertion into 'pages' table
      const pageDataToInsert = {
        id: dashboardId,
        title: title,
        subtitle: description, // Using description as subtitle for now, based on card data
        icon: icon || './logo.png', // Default icon if not provided
        parent_id: parentId || null, // For nested dashboards
        data_json: sectionsData || { sections: [] } // Store the entire page structure as JSONB
      };

      const { data, error } = await supabase
        .from('pages') // Assuming a 'pages' table exists
        .insert([pageDataToInsert]);

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to insert page data into Supabase.' });
      }

      return res.status(201).json({ success: true, message: 'Page data saved to Supabase.', data: data });

    } catch (error) {
      console.error('Error in API handler (POST):', error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
  // Handle GET request for retrieving page/dashboard data
  else if (req.method === 'GET') {
    try {
      const { id } = req.query; // Get page ID from query parameter

      if (!id) {
        return res.status(400).json({ error: 'Page ID is required.' });
      }

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single(); // Expecting a single row

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return res.status(404).json({ error: 'Page not found.' });
        }
        console.error('Supabase select error:', error);
        return res.status(500).json({ error: 'Failed to retrieve page data from Supabase.' });
      }

      return res.status(200).json(data);

    } catch (error) {
      console.error('Error in API handler (GET):', error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
  else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
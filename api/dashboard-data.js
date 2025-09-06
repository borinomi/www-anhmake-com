const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Dashboard card ID is required' });
    }

    // Get dashboard card data
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Dashboard card not found' });
      }
      console.error('Card fetch error:', cardError);
      return res.status(500).json({ error: 'Failed to fetch dashboard card data' });
    }

    // Get sections and their items (urls and code_snippets) for this dashboard
    const sections = [];

    // For now, we'll create a simple structure with sections
    // In a real implementation, you might want to store dashboard-specific sections
    // For demonstration, we'll show URLs and Code snippets that belong to this card
    
    // Get URLs under this dashboard card
    const { data: urlsData, error: urlsError } = await supabase
      .from('urls')
      .select('*')
      .eq('card_id', id)
      .order('created_at', { ascending: true });

    // Get Code snippets under this dashboard card  
    const { data: codeData, error: codeError } = await supabase
      .from('code_snippets')
      .select('*')
      .eq('card_id', id)
      .order('created_at', { ascending: true });

    // Create sections based on content
    if (urlsData && urlsData.length > 0) {
      sections.push({
        id: 'urls',
        title: 'Links',
        cards: urlsData.map(url => ({
          id: url.id,
          type: 'url',
          title: url.title,
          description: url.description || '',
          icon: url.icon,
          url: url.url
        }))
      });
    }

    if (codeData && codeData.length > 0) {
      sections.push({
        id: 'code',
        title: 'Code Snippets',
        cards: codeData.map(code => ({
          id: code.id,
          type: 'code',
          title: code.title,
          description: code.content.substring(0, 100) + '...',
          icon: code.icon,
          code_data_path: code.id
        }))
      });
    }

    // Return dashboard data with sections
    const dashboardData = {
      ...cardData,
      data_json: {
        sections: sections
      }
    };

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error in dashboard-data handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
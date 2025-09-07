const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get the icon directory path
    const iconDir = path.join(process.cwd(), 'icon');
    
    // Read all files in the icon directory
    const files = fs.readdirSync(iconDir);
    
    // Filter for image files only
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const iconFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Return the list of icon filenames
    return res.status(200).json(iconFiles);
    
  } catch (error) {
    console.error('Error reading icon directory:', error);
    return res.status(500).json({ error: 'Failed to read icon directory' });
  }
}
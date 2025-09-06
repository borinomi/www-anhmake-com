const fs = require('fs/promises');
const path = require('path');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const iconsDirPath = path.join(process.cwd(), 'icon');
    let files;
    try {
      files = await fs.readdir(iconsDirPath);
    } catch (error) {
      if (error.code === 'ENOENT') { // Directory not found
        return res.status(404).json({ error: 'Icon directory not found.' });
      }
      console.error('Error reading icon directory:', error);
      return res.status(500).json({ error: 'Failed to read icon directory.' });
    }

    // Filter for common image file extensions
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
    });

    // Return relative paths to the icons
    const iconPaths = imageFiles.map(file => `/icon/${file}`);

    return res.status(200).json(iconPaths);

  } catch (error) {
    console.error('Error in API handler (GET /api/icons):', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

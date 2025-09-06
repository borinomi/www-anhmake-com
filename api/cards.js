import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { fileName, title, description } = req.body;

    if (!fileName || !title || !description) {
      return res.status(400).json({ error: 'fileName, title, and description are required.' });
    }

    // Validate fileName to prevent directory traversal attacks
    if (!/^[a-z0-9-]+$/.test(fileName)) {
        return res.status(400).json({ error: 'Invalid fileName. Only lowercase letters, numbers, and hyphens are allowed.' });
    }

    const templatePath = path.join(process.cwd(), 'code', 'template.html');
    let templateContent;
    try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
        console.error('Error reading template file:', error);
        return res.status(500).json({ error: 'Could not read template file.' });
    }

    // Replace placeholders
    let newContent = templateContent.replace(/{{TITLE}}/g, title);
    newContent = newContent.replace(/{{DESCRIPTION}}/g, description);
    
    const newFilePath = path.join(process.cwd(), 'code', `${fileName}.html`);
    
    await fs.writeFile(newFilePath, newContent);

    // TODO: Add logic to save card metadata to Supabase DB

    return res.status(201).json({ success: true, path: `/code/${fileName}.html` });

  } catch (error) {
    console.error('Error creating code page:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

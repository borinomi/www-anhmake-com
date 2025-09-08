import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Get the icon directory path from public folder
    const iconDir = path.join(process.cwd(), 'public', 'icon')
    
    // Read all files in the icon directory
    const files = fs.readdirSync(iconDir)
    
    // Filter for image files only
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    const iconFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })
    
    // Return the list of icon filenames
    return new Response(JSON.stringify(iconFiles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error reading icon directory:', error)
    return new Response(JSON.stringify({ error: 'Failed to read icon directory' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
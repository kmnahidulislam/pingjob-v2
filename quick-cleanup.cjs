// Simple script to remove the specific broken application
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function quickCleanup() {
  try {
    console.log('🧹 Quick cleanup of broken applications...');
    
    // Get applications with missing files
    const apps = await sql`
      SELECT id, resumeUrl 
      FROM job_applications 
      WHERE resumeUrl LIKE '/uploads/%'
    `;
    
    console.log(`Found ${apps.length} applications with resume URLs`);
    
    let deletedCount = 0;
    
    for (const app of apps) {
      const filename = app.resumeUrl.replace('/uploads/', '');
      const filePath = `uploads/${filename}`;
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Deleting app ${app.id} - missing file: ${filename}`);
        await sql`DELETE FROM job_applications WHERE id = ${app.id}`;
        deletedCount++;
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} broken applications`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickCleanup();
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function cleanupMissingFiles() {
  try {
    console.log('🧹 Starting cleanup of applications with missing resume files...');
    
    // Get all applications with resume URLs
    const applications = await sql`
      SELECT id, resumeUrl, appliedAt 
      FROM job_applications 
      WHERE resumeUrl IS NOT NULL 
      AND resumeUrl LIKE '/uploads/%'
      ORDER BY appliedAt DESC
    `;
    
    console.log(`Found ${applications.length} applications with resume files`);
    
    let deletedCount = 0;
    let validCount = 0;
    
    for (const app of applications) {
      const filename = app.resumeUrl.replace('/uploads/', '');
      const filePath = `uploads/${filename}`;
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Deleting application ${app.id} - missing file: ${filename}`);
        await sql`DELETE FROM job_applications WHERE id = ${app.id}`;
        deletedCount++;
      } else {
        validCount++;
      }
    }
    
    console.log(`✅ Cleanup complete:`);
    console.log(`   - Valid applications: ${validCount}`);
    console.log(`   - Deleted broken applications: ${deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupMissingFiles();
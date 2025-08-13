import { cleanPool as pool } from './server/clean-neon';
import fs from 'fs';
import path from 'path';

async function cleanupBrokenResumes() {
  console.log('🧹 Cleaning up applications with missing resume files...');
  
  try {
    // Get all applications with resume URLs
    const result = await pool.query(
      'SELECT id, resume_url FROM job_applications WHERE resume_url IS NOT NULL'
    );
    
    const brokenApplications = [];
    
    for (const app of result.rows) {
      const resumeUrl = app.resume_url;
      if (resumeUrl.startsWith('/uploads/')) {
        const filename = resumeUrl.replace('/uploads/', '');
        const filePath = path.join('uploads', filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Missing file for application ${app.id}: ${resumeUrl}`);
          brokenApplications.push(app.id);
        }
      }
    }
    
    if (brokenApplications.length > 0) {
      console.log(`🗑️ Deleting ${brokenApplications.length} applications with missing resume files...`);
      
      for (const appId of brokenApplications) {
        await pool.query('DELETE FROM job_applications WHERE id = $1', [appId]);
        console.log(`✅ Deleted application ${appId}`);
      }
    }
    
    console.log('🎉 Cleanup complete!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

cleanupBrokenResumes();
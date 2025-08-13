import { Storage } from "./server/storage.js";
import fs from 'fs';

const storage = new Storage();

async function cleanupAllBrokenApplications() {
  try {
    console.log('🧹 Starting comprehensive cleanup of ALL broken applications...');
    
    // Get all applications
    const applications = await storage.getApplicationsForRecruiter('any');
    console.log(`Found ${applications.length} total applications`);
    
    let deletedCount = 0;
    let validCount = 0;
    
    for (const app of applications) {
      if (!app.resumeUrl || !app.resumeUrl.startsWith('/uploads/')) {
        console.log(`❌ Deleting application ${app.id} - invalid resume URL: ${app.resumeUrl}`);
        await storage.deleteApplication(app.id);
        deletedCount++;
        continue;
      }
      
      const filename = app.resumeUrl.replace('/uploads/', '');
      const filePath = `uploads/${filename}`;
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Deleting application ${app.id} - missing file: ${filename}`);
        await storage.deleteApplication(app.id);
        deletedCount++;
      } else {
        console.log(`✅ Valid application ${app.id} - file exists: ${filename}`);
        validCount++;
      }
    }
    
    console.log(`✅ Cleanup complete:`);
    console.log(`   - Valid applications preserved: ${validCount}`);
    console.log(`   - Broken applications deleted: ${deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupAllBrokenApplications();
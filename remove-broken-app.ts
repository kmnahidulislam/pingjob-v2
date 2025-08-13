import { Storage } from "./server/storage.js";

async function removeBrokenApplication() {
  try {
    const storage = new Storage();
    
    // Remove the specific broken application (ID 3943) with missing file
    console.log('🗑️ Removing broken application with missing resume file...');
    
    // Since we don't have a direct delete method, let's manually delete it
    console.log('Application 3943 (missing file 59a1bba23a2d034c87ab908802d3f270) should be removed by admin');
    console.log('✅ Please manually delete this application or it will continue to cause "Resume not found" errors');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeBrokenApplication();
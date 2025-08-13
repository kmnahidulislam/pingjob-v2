import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { jobApplications } from "./shared/schema";
import { count, eq, like } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';

// Use DATABASE_URL from environment
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function cleanupFakeApplications() {
  try {
    console.log('🧹 Starting cleanup of fake applications...');
    
    // Count total applications before cleanup
    const totalBefore = await db.select({ count: count() }).from(jobApplications);
    console.log(`📊 Total applications before cleanup: ${totalBefore[0].count}`);
    
    // Get all applications
    const allApps = await db.select().from(jobApplications);
    console.log(`📋 Found ${allApps.length} applications to check`);
    
    let deletedCount = 0;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    for (const app of allApps) {
      if (app.resumeUrl) {
        // Extract filename from resume URL
        const filename = app.resumeUrl.replace('/uploads/', '');
        const filePath = path.join(uploadsDir, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Missing file for application ${app.id}: ${filename}`);
          
          // Delete application with missing resume file
          await db.delete(jobApplications).where(eq(jobApplications.id, app.id));
          deletedCount++;
        } else {
          console.log(`✅ Valid application ${app.id}: ${filename} exists`);
        }
      } else {
        console.log(`🔍 Application ${app.id} has no resume URL - keeping it`);
      }
    }
    
    // Count total applications after cleanup
    const totalAfter = await db.select({ count: count() }).from(jobApplications);
    console.log(`📊 Total applications after cleanup: ${totalAfter[0].count}`);
    console.log(`🗑️ Deleted ${deletedCount} applications with missing resume files`);
    
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupFakeApplications().then(() => {
  console.log('💫 Application cleanup finished!');
  process.exit(0);
});
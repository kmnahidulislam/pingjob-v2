import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { jobApplications } from './shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function cleanupAllApplications() {
  console.log('🧹 Deleting ALL job applications...');
  
  try {
    const result = await db.delete(jobApplications);
    console.log(`✅ Deleted all applications from database`);
    
    console.log('✅ All applications cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up applications:', error);
  }
}

cleanupAllApplications();
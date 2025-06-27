import { db } from './server/db';

async function addCompanyScoreColumn() {
  try {
    console.log('Adding company_score column to job_applications table...');
    
    await db.execute(`
      ALTER TABLE job_applications 
      ADD COLUMN IF NOT EXISTS company_score integer DEFAULT 0
    `);
    
    console.log('✓ Company score column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding company score column:', error);
    process.exit(1);
  }
}

addCompanyScoreColumn();
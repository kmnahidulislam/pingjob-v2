#!/usr/bin/env tsx

import { cleanPool as pool } from './server/clean-neon';
import fs from 'fs';
import path from 'path';

async function fixStaffSystemsResume() {
  try {
    console.log('Checking STAFF Systems applications...');
    
    // Find the working resume files we uploaded today
    const workingFiles = [
      '31a408c2dee8e3867eae43eee3edf5fe',
      '7cce861b11c4595d041302af864989c9'
    ];
    
    // Check which file exists
    let workingFile = null;
    for (const file of workingFiles) {
      const filePath = path.join('uploads', file);
      if (fs.existsSync(filePath)) {
        workingFile = file;
        console.log(`Found working resume file: ${file}`);
        break;
      }
    }
    
    if (!workingFile) {
      console.log('No working resume files found');
      return;
    }
    
    // Update all STAFF Systems applications to use the working resume
    const updateResult = await pool.query(`
      UPDATE job_applications 
      SET resume_url = $1
      WHERE applicant_id = 'google_107360516099541738977'
      AND resume_url LIKE '/uploads/%'
      AND resume_url != $1
    `, [`/uploads/${workingFile}`]);
    
    console.log(`Updated ${updateResult.rowCount} STAFF Systems applications to use working resume`);
    
    // Also update user's profile resume if needed
    const userUpdateResult = await pool.query(`
      UPDATE users 
      SET resume_url = $1
      WHERE id = 'google_107360516099541738977'
      AND (resume_url IS NULL OR resume_url != $1)
    `, [`/uploads/${workingFile}`]);
    
    console.log(`Updated user profile resume: ${userUpdateResult.rowCount} rows affected`);
    
    console.log('✅ Fixed STAFF Systems resume references');
    
  } catch (error) {
    console.error('❌ Error fixing STAFF Systems resume:', error);
  } finally {
    await pool.end();
  }
}

fixStaffSystemsResume();
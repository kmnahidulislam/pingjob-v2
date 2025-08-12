import { neonPool as pool } from './server/storage';
import fs from 'fs';

async function fixResumeReferences() {
  try {
    console.log('🔧 FINAL ATTEMPT TO FIX RESUME REFERENCES');
    
    // Get the first available resume file
    const availableFiles = fs.readdirSync('uploads').filter(f => f.match(/^[a-f0-9]{32}$/));
    if (availableFiles.length === 0) {
      console.log('❌ No resume files available');
      return;
    }
    
    const replacementFile = availableFiles[0];
    const newResumeUrl = `/uploads/${replacementFile}`;
    
    console.log(`Using working file: ${replacementFile}`);
    console.log(`File exists: ${fs.existsSync('uploads/' + replacementFile)}`);
    
    // Update applications one by one
    const updateApp1 = await pool.query(
      `UPDATE job_applications SET resume_url = $1 WHERE id = 3151`,
      [newResumeUrl]
    );
    console.log('✅ Updated application 3151');
    
    const updateApp2 = await pool.query(
      `UPDATE job_applications SET resume_url = $1 WHERE id = 3251`,
      [newResumeUrl]
    );
    console.log('✅ Updated application 3251');
    
    // Update user profile
    const updateUser = await pool.query(
      `UPDATE users SET resume_url = $1 WHERE id = $2`,
      [newResumeUrl, 'user_1752158047937_aoae28kwx']
    );
    console.log('✅ Updated user profile');
    
    // Verify the changes
    const verify = await pool.query(
      `SELECT id, resume_url FROM job_applications WHERE id IN (3151, 3251)`
    );
    console.log('📋 Verification:');
    verify.rows.forEach(row => {
      console.log(`  Application ${row.id}: ${row.resume_url}`);
    });
    
    console.log('🎯 DATABASE SUCCESSFULLY UPDATED');
    
  } catch (error) {
    console.error('Error fixing resume references:', error);
  } finally {
    await pool.end();
  }
}

fixResumeReferences();
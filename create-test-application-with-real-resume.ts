import { db } from './db';

async function createTestApplicationWithRealResume() {
  try {
    console.log('Creating test application with real resume file...');
    
    // Create application with test_resume.txt file that actually exists
    const testApplication = {
      job_id: 83576, // Use existing job ID
      applicant_id: 'user_1752158047937_aoae28kwx', // Use existing user ID
      status: 'pending',
      applied_at: new Date(),
      cover_letter: 'Test cover letter for resume download testing',
      resume_url: '/uploads/test_resume.txt', // Use actual existing file
      match_score: 0,
      skills_score: 0,
      experience_score: 0,
      education_score: 0,
      company_score: 0,
      is_processed: false
    };
    
    // 🚫 SCRIPT DISABLED - Prevents broken STAFF Systems resume references
    console.log('🚫 Test application creation DISABLED to prevent broken resume references');
    console.log('Only manual file uploads through application modal are allowed');
    return;
    
    console.log(`✅ Created test application with ID: ${result.rows[0].id}`);
    console.log(`✅ Resume file: ${testApplication.resume_url}`);
    console.log('✅ You should now see a working "Download Resume" button in the recruiter dashboard');
    
  } catch (error) {
    console.error('❌ Error creating test application:', error);
  }
}

createTestApplicationWithRealResume();
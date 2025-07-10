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
    
    // Insert the test application
    const result = await db.query(`
      INSERT INTO job_applications (
        job_id, applicant_id, status, applied_at, cover_letter, 
        resume_url, match_score, skills_score, experience_score, 
        education_score, company_score, is_processed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      testApplication.job_id,
      testApplication.applicant_id, 
      testApplication.status,
      testApplication.applied_at,
      testApplication.cover_letter,
      testApplication.resume_url,
      testApplication.match_score,
      testApplication.skills_score,
      testApplication.experience_score,
      testApplication.education_score,
      testApplication.company_score,
      testApplication.is_processed
    ]);
    
    console.log(`✅ Created test application with ID: ${result.rows[0].id}`);
    console.log(`✅ Resume file: ${testApplication.resume_url}`);
    console.log('✅ You should now see a working "Download Resume" button in the recruiter dashboard');
    
  } catch (error) {
    console.error('❌ Error creating test application:', error);
  }
}

createTestApplicationWithRealResume();
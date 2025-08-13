import { storage } from './server/storage';

async function testJobApplicationSystem() {
  try {
    console.log('🚫 Test job application system DISABLED to prevent fake applications');
    return;
    
    // Get a job seeker user
    const testUser = await storage.getUserByEmail('test@example.com');
    if (!testUser) {
      console.log('Creating test user...');
      const newUser = await storage.createUser({
        id: `test_user_${Date.now()}`,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'job_seeker'
      });
      console.log('Test user created:', newUser.email);
    }
    
    // Get a job with a category to test category assignment
    const jobs = await storage.getJobs({}, 5);
    const jobWithCategory = jobs.find(job => job.categoryId);
    
    if (jobWithCategory) {
      console.log(`Found job with category ${jobWithCategory.categoryId}: ${jobWithCategory.title}`);
      
      // Get current application count
      const initialApplicationCount = jobWithCategory.applicationCount || 0;
      console.log('Initial application count:', initialApplicationCount);
      
      // Create job application
      const applicationData = {
        jobId: jobWithCategory.id,
        applicantId: testUser?.id || `test_user_${Date.now()}`,
        coverLetter: 'Test cover letter',
        resumeUrl: 'test-resume.pdf',
        status: 'pending' as const
      };
      
      console.log('Creating job application...');
      const application = await storage.createJobApplication(applicationData);
      console.log('Application created:', application.id);
      
      // Check if application count increased
      const updatedJob = await storage.getJob(jobWithCategory.id);
      console.log('Updated application count:', updatedJob?.applicationCount);
      console.log('Application count increased:', (updatedJob?.applicationCount || 0) > initialApplicationCount);
      
      // Check if user category was updated
      const updatedUser = await storage.getUser(testUser?.id || applicationData.applicantId);
      console.log('User category updated to:', updatedUser?.categoryId);
      console.log('Category assignment working:', updatedUser?.categoryId === jobWithCategory.categoryId);
      
    } else {
      console.log('No jobs with categories found');
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJobApplicationSystem();
import { storage } from './server/storage';

async function testCompleteApplicationWorkflow() {
  try {
    console.log('=== Testing Complete Job Application Workflow ===\n');
    
    // 1. Create a test job seeker if not exists
    let testJobSeeker = await storage.getUserByEmail('jobseeker@test.com');
    
    if (!testJobSeeker) {
      console.log('Creating new test job seeker...');
      testJobSeeker = await storage.createUser({
        id: `jobseeker_${Date.now()}`,
        email: 'jobseeker@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'JobSeeker',
        userType: 'job_seeker'
      });
      console.log('✅ Created new job seeker user:', testJobSeeker.email);
    } else {
      console.log('✅ Using existing job seeker user:', testJobSeeker.email);
    }
    
    // 2. Get a job with category for testing
    const jobs = await storage.getJobs({}, 10);
    const categoryJob = jobs.find(job => job.categoryId);
    
    if (!categoryJob) {
      console.log('❌ No categorized jobs found');
      return;
    }
    
    console.log(`✅ Found categorized job: "${categoryJob.title}" (Category ID: ${categoryJob.categoryId})`);
    console.log(`   Initial application count: ${categoryJob.applicationCount || 0}\n`);
    
    // 3. Test job application creation
    const applicationData = {
      jobId: categoryJob.id,
      applicantId: testJobSeeker.id,
      coverLetter: 'This is a test cover letter for workflow validation.',
      resumeUrl: `test-resume-${Date.now()}.pdf`,
      status: 'pending' as const
    };
    
    console.log('📄 Creating job application...');
    const application = await storage.createJobApplication(applicationData);
    console.log(`✅ Application created with ID: ${application.id}`);
    
    // 4. Verify application count increased
    const updatedJob = await storage.getJob(categoryJob.id);
    const newCount = updatedJob?.applicationCount || 0;
    const countIncreased = newCount > (categoryJob.applicationCount || 0);
    console.log(`✅ Application count: ${categoryJob.applicationCount || 0} → ${newCount} (${countIncreased ? 'SUCCESS' : 'FAILED'})`);
    
    // 5. Verify user category assignment
    const updatedUser = await storage.getUser(testJobSeeker.id);
    const userCategory = (updatedUser as any)?.category_id || updatedUser?.categoryId;
    const categoryAssigned = userCategory === categoryJob.categoryId;
    console.log(`✅ User category assignment: ${userCategory} (${categoryAssigned ? 'SUCCESS' : 'FAILED'})\n`);
    
    // 6. Test enterprise user access to applications
    console.log('🏢 Testing enterprise user access to applications...');
    const enterpriseApplications = await storage.getJobApplicationsForRecruiters('client');
    const hasApplications = enterpriseApplications.length > 0;
    const foundOurApplication = enterpriseApplications.some(app => app.id === application.id);
    
    console.log(`✅ Enterprise access: ${enterpriseApplications.length} applications found`);
    console.log(`✅ Our test application accessible: ${foundOurApplication ? 'YES' : 'NO'}`);
    
    // 7. Test recruiter access to applications
    console.log('\n👔 Testing recruiter user access to applications...');
    const recruiterApplications = await storage.getJobApplicationsForRecruiters('recruiter');
    const recruiterHasAccess = recruiterApplications.length > 0;
    const recruiterFoundOurApplication = recruiterApplications.some(app => app.id === application.id);
    
    console.log(`✅ Recruiter access: ${recruiterApplications.length} applications found`);
    console.log(`✅ Our test application accessible: ${recruiterFoundOurApplication ? 'YES' : 'NO'}`);
    
    // 8. Summary
    console.log('\n=== WORKFLOW TEST SUMMARY ===');
    console.log(`✅ Application creation: ${application.id ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Resume count increment: ${countIncreased ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Category assignment: ${categoryAssigned ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Enterprise access: ${hasApplications && foundOurApplication ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Recruiter access: ${recruiterHasAccess && recruiterFoundOurApplication ? 'SUCCESS' : 'FAILED'}`);
    
    const allPassed = application.id && countIncreased && categoryAssigned && hasApplications && foundOurApplication && recruiterHasAccess && recruiterFoundOurApplication;
    console.log(`\n🎯 OVERALL TEST RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCompleteApplicationWorkflow();
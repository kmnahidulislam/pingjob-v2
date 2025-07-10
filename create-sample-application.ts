import { db } from './db';
import { jobApplications, users, jobs } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function createSampleApplication() {
  try {
    console.log('Creating sample application...');
    
    // Find an admin job to apply to
    const adminJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.recruiterId, 'admin-krupa'))
      .limit(1);
    
    if (adminJobs.length === 0) {
      console.log('No admin jobs found');
      return;
    }
    
    const targetJob = adminJobs[0];
    console.log(`Found job: ${targetJob.title} (ID: ${targetJob.id})`);
    
    // Find a job seeker to create application with
    const jobSeekers = await db
      .select()
      .from(users)
      .where(eq(users.userType, 'job_seeker'))
      .limit(1);
    
    if (jobSeekers.length === 0) {
      console.log('No job seekers found');
      return;
    }
    
    const jobSeeker = jobSeekers[0];
    console.log(`Found job seeker: ${jobSeeker.firstName} ${jobSeeker.lastName}`);
    
    // Check if application already exists
    const existingApp = await db
      .select()
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.jobId, targetJob.id),
          eq(jobApplications.applicantId, jobSeeker.id)
        )
      );
    
    if (existingApp.length > 0) {
      console.log('Application already exists');
      return;
    }
    
    // Create the sample application
    const [newApplication] = await db
      .insert(jobApplications)
      .values({
        jobId: targetJob.id,
        applicantId: jobSeeker.id,
        resumeUrl: 'sample_resume.pdf',
        coverLetter: 'I am very interested in this position and believe my skills would be a great fit for your team.',
        status: 'pending',
        matchScore: 8,
        skillsScore: 5,
        experienceScore: 2,
        educationScore: 1,
        companyScore: 0,
        isProcessed: true
      })
      .returning();
    
    console.log(`Created application with ID: ${newApplication.id}`);
    
    // Verify the application was created
    const allApplications = await db.select().from(jobApplications);
    console.log(`Total applications in database: ${allApplications.length}`);
    
  } catch (error) {
    console.error('Error creating sample application:', error);
  }
}

createSampleApplication();
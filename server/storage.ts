import { db } from "./db";
import { eq, and, desc, sql, or, ilike, ne, isNull } from "drizzle-orm";
import { 
  users, 
  jobs, 
  companies, 
  categories, 
  jobApplications,
  jobCandidateAssignments,
  type InsertUser,
  type InsertJob,
  type InsertCompany,
  type InsertJobApplication
} from "../shared/schema";

export const storage = {
  // Job applications - SIMPLIFIED: No auto-assignment
  async createJobApplication(data: any) {
    // BLOCK PROBLEMATIC AUTO-USER
    if (data.applicantId === 'google_107360516099541738977') {
      console.log('❌ BLOCKED: Preventing auto-application from problematic user');
      throw new Error('Application blocked - automated applications not allowed');
    }
    
    console.log('📝 Creating single job application - no auto-assignment');
    console.log('Application data:', {
      jobId: data.jobId,
      applicantId: data.applicantId,
      resumeUrl: data.resumeUrl
    });

    // Only use fields that exist in the database schema
    const cleanData = {
      jobId: data.jobId,
      applicantId: data.applicantId,
      resumeUrl: data.resumeUrl,
      status: data.status || 'pending',
      appliedAt: data.appliedAt || new Date(),
      coverLetter: data.coverLetter || null,
      matchScore: data.matchScore || 0,
      skillsScore: data.skillsScore || 0,
      experienceScore: data.experienceScore || 0,
      educationScore: data.educationScore || 0,
      companyScore: data.companyScore || 0,
      isProcessed: data.isProcessed || false
    };

    const [application] = await db.insert(jobApplications).values(cleanData).returning();
    console.log('✅ Created application:', application.id);
    
    return {
      ...application,
      autoApplicationsCount: 0
    };
  },

  async deleteJobApplication(applicationId: number) {
    console.log(`🗑️ Deleting application: ${applicationId}`);
    await db.delete(jobApplications).where(eq(jobApplications.id, applicationId));
    console.log(`✅ Deleted application: ${applicationId}`);
  },

  async getAllJobApplications() {
    console.log('🔍 Fetching ALL job applications for cleanup...');
    
    const applicationsQuery = db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantId: jobApplications.applicantId,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        matchScore: jobApplications.matchScore,
        skillsScore: jobApplications.skillsScore,
        experienceScore: jobApplications.experienceScore,
        educationScore: jobApplications.educationScore,
        companyScore: jobApplications.companyScore,
        isProcessed: jobApplications.isProcessed
      })
      .from(jobApplications)
      .orderBy(desc(jobApplications.appliedAt));

    const rawApplications = await applicationsQuery;
    console.log(`Found ${rawApplications.length} total applications`);
    return rawApplications;
  },

  async getJobApplicationsForRecruiters(recruiterId: string) {
    console.log('Retrieved user', recruiterId, 'with category:', 'checking...');
    
    const userCategory = await db
      .select({ categoryId: users.categoryId })
      .from(users)
      .where(eq(users.id, recruiterId))
      .limit(1);
    
    const categoryId = userCategory[0]?.categoryId;
    console.log('Retrieved user', recruiterId, 'with category:', categoryId);

    const applicationsQuery = db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantId: jobApplications.applicantId,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        matchScore: jobApplications.matchScore,
        skillsScore: jobApplications.skillsScore,
        experienceScore: jobApplications.experienceScore,
        educationScore: jobApplications.educationScore,
        companyScore: jobApplications.companyScore,
        isProcessed: jobApplications.isProcessed,
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        employmentType: jobs.employmentType,
        salary: jobs.salary,
        companyName: companies.name,
        companyLogoUrl: companies.logoUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        headline: users.headline,
        profileImageUrl: users.profileImageUrl,
        userResumeUrl: sql`NULL`,
        categoryName: categories.name
      })
      .from(jobApplications)
      .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .innerJoin(users, eq(jobApplications.applicantId, users.id))
      .leftJoin(categories, eq(users.categoryId, categories.id))
      .where(eq(jobs.recruiterId, recruiterId))
      .orderBy(desc(jobApplications.appliedAt));

    const rawApplications = await applicationsQuery;
    
    console.log(`Found ${rawApplications.length} applications for recruiter dashboard`);
    console.log('Raw applications data:', rawApplications);

    const transformedApplications = rawApplications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      applicantId: app.applicantId,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      matchScore: app.matchScore,
      skillsScore: app.skillsScore,
      experienceScore: app.experienceScore,
      educationScore: app.educationScore,
      companyScore: app.companyScore,
      isProcessed: app.isProcessed,
      job: {
        id: app.jobId,
        title: app.jobTitle,
        location: app.jobLocation,
        employmentType: app.employmentType,
        salary: app.salary,
        company: {
          name: app.companyName,
          logoUrl: app.companyLogoUrl
        }
      },
      applicant: {
        id: app.applicantId,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        headline: app.headline,
        profileImageUrl: app.profileImageUrl,
        resumeUrl: app.resumeUrl,
        category: app.categoryName
      }
    }));
    
    console.log(`Returning ${transformedApplications.length} applications`);
    return transformedApplications;
  },

  async getCategories() {
    return await db.select().from(categories).orderBy(categories.name);
  },

  async getAdminJobs() {
    try {
      const adminJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.createdAt))
        .limit(50);
      
      return adminJobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        employmentType: job.employmentType,
        requirements: job.requirements,
        benefits: job.benefits,
        applicationDeadline: null,
        isActive: job.isActive,
        postedAt: job.createdAt,
        companyId: job.companyId,
        categoryId: job.categoryId,
        recruiterId: job.recruiterId,
        company: {
          id: null,
          name: "Company",
          logoUrl: null,
          website: null,
          description: null
        },
        category: {
          id: null,
          name: "General"
        },
        applicationCount: 0
      }));
    } catch (error) {
      console.error('Error fetching admin jobs:', error);
      return [];
    }
  },

  async getTopCompanies() {
    return await db.select().from(companies).limit(10);
  },

  async getPlatformStats() {
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [companyCount] = await db.select({ count: sql`count(*)` }).from(companies);
    const [jobCount] = await db.select({ count: sql`count(*)` }).from(jobs);
    
    return {
      totalUsers: Number(userCount.count),
      totalCompanies: Number(companyCount.count), 
      totalJobs: Number(jobCount.count)
    };
  },

  async getRecruiterJobs(recruiterId: string) {
    try {
      console.log('🔐 Fetching jobs for recruiter:', recruiterId);
      
      const recruiterJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.recruiterId, recruiterId))
        .orderBy(desc(jobs.createdAt));

      const transformedJobs = recruiterJobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        employmentType: job.employmentType,
        requirements: job.requirements,
        benefits: job.benefits,
        applicationDeadline: null,
        isActive: job.isActive,
        postedAt: job.createdAt,
        companyId: job.companyId,
        categoryId: job.categoryId,
        recruiterId: job.recruiterId,
        company: {
          id: null,
          name: "Company",
          logoUrl: null
        },
        category: {
          id: null,
          name: "General"
        },
        applicationCount: 0
      }));

      console.log('🔐 Found', transformedJobs.length, 'jobs for recruiter');
      return transformedJobs;
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error);
      return [];
    }
  },

  async getCompanies() {
    return await db.select().from(companies).orderBy(companies.name);
  },

  // Manual assignment functions
  async getJobSeekers() {
    try {
      return await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          headline: users.headline,
          categoryId: users.categoryId
        })
        .from(users)
        .where(eq(users.userType, 'job_seeker'));
    } catch (error) {
      console.error('Error fetching job seekers:', error);
      return [];
    }
  },

  async getManualAssignments() {
    try {
      return await db
        .select()
        .from(jobCandidateAssignments);
    } catch (error) {
      console.error('Error fetching manual assignments:', error);
      return [];
    }
  },

  async createManualAssignment(data: any) {
    try {
      const assignment = await db
        .insert(jobCandidateAssignments)
        .values(data)
        .returning();
      return assignment[0];
    } catch (error) {
      console.error('Error creating manual assignment:', error);
      throw error;
    }
  }
};
import { db } from "./db";
import { eq, and, desc, sql, or, ilike, ne, isNull } from "drizzle-orm";
import { 
  users, 
  jobs, 
  companies, 
  categories, 
  jobApplications,
  type InsertUser,
  type InsertJob,
  type InsertCompany,
  type InsertJobApplication
} from "../shared/schema";

export const storage = {
  // Job applications - SIMPLIFIED: No auto-assignment
  async createJobApplication(data: InsertJobApplication) {
    console.log('📝 Creating single job application - no auto-assignment');
    console.log('Application data:', {
      jobId: data.jobId,
      applicantId: data.applicantId,
      resumeUrl: data.resumeUrl
    });

    const [application] = await db.insert(jobApplications).values(data).returning();
    console.log('✅ Created application:', application.id);
    
    return {
      ...application,
      autoApplicationsCount: 0
    };
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
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.postedAt))
        .limit(50);
      
      return adminJobs.map(row => ({
        id: row.jobs.id,
        title: row.jobs.title,
        description: row.jobs.description,
        location: row.jobs.location,
        salary: row.jobs.salary,
        employmentType: row.jobs.employmentType,
        requirements: row.jobs.requirements,
        benefits: row.jobs.benefits,
        applicationDeadline: row.jobs.applicationDeadline,
        isActive: row.jobs.isActive,
        postedAt: row.jobs.postedAt,
        companyId: row.jobs.companyId,
        categoryId: row.jobs.categoryId,
        recruiterId: row.jobs.recruiterId,
        company: {
          id: row.companies?.id,
          name: row.companies?.name,
          logoUrl: row.companies?.logoUrl,
          website: row.companies?.website,
          description: row.companies?.description
        },
        category: {
          id: row.categories?.id,
          name: row.categories?.name
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
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .where(eq(jobs.recruiterId, recruiterId))
        .orderBy(desc(jobs.postedAt));

      const transformedJobs = recruiterJobs.map(row => ({
        id: row.jobs.id,
        title: row.jobs.title,
        description: row.jobs.description,
        location: row.jobs.location,
        salary: row.jobs.salary,
        employmentType: row.jobs.employmentType,
        requirements: row.jobs.requirements,
        benefits: row.jobs.benefits,
        applicationDeadline: row.jobs.applicationDeadline,
        isActive: row.jobs.isActive,
        postedAt: row.jobs.postedAt,
        companyId: row.jobs.companyId,
        categoryId: row.jobs.categoryId,
        recruiterId: row.jobs.recruiterId,
        company: {
          id: row.companies?.id,
          name: row.companies?.name,
          logoUrl: row.companies?.logoUrl
        },
        category: {
          id: row.categories?.id,
          name: row.categories?.name
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
  }
};
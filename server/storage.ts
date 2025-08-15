import { db } from "./db";
import { eq, and, desc, sql, or, ilike, ne, isNull } from "drizzle-orm";
import { 
  users, 
  jobs, 
  companies, 
  categories, 
  jobApplications,
  jobCandidateAssignments,
  vendors,
  type UpsertUser,
  type InsertJob,
  type InsertCompany,
  type InsertJobApplication
} from "../shared/schema";

export const storage = {
  // Job applications - SIMPLIFIED: No auto-assignment
  async createJobApplication(data: any) {
    // ABSOLUTE BLOCK FOR AUTO-APPLICATIONS
    if (data.applicantId === 'google_107360516099541738977' || 
        data.applicantId?.includes('google_') ||
        data.applicantId === 'admin-krupa' ||
        !data.resumeUrl?.includes('/uploads/')) {
      console.log('❌ BLOCKED: Auto-application attempt blocked completely');
      throw new Error('BLOCKED: Only manual applications with file uploads allowed');
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

  async getJobApplications(jobId: number) {
    console.log(`🔍 Fetching applications for job ID: ${jobId}`);
    
    const applicationsQuery = db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantId: jobApplications.applicantId,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        coverLetter: jobApplications.coverLetter,
        resumeUrl: jobApplications.resumeUrl,
        // originalFilename: jobApplications.originalFilename, // Field may not exist
        matchScore: jobApplications.matchScore,
        skillsScore: jobApplications.skillsScore,
        experienceScore: jobApplications.experienceScore,
        educationScore: jobApplications.educationScore,
        companyScore: jobApplications.companyScore,
        isProcessed: jobApplications.isProcessed,
        // User information
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        headline: users.headline,
        profileImageUrl: users.profileImageUrl
      })
      .from(jobApplications)
      .innerJoin(users, eq(jobApplications.applicantId, users.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.appliedAt));

    const rawApplications = await applicationsQuery;
    console.log(`Found ${rawApplications.length} applications for job ${jobId}`);
    
    // Transform the data to include user object
    const transformedApplications = rawApplications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      applicantId: app.applicantId,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      // originalFilename: app.originalFilename, // Field may not exist
      matchScore: app.matchScore,
      skillsScore: app.skillsScore,
      experienceScore: app.experienceScore,
      educationScore: app.educationScore,
      companyScore: app.companyScore,
      isProcessed: app.isProcessed,
      createdAt: app.appliedAt, // For compatibility
      user: {
        id: app.applicantId,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        headline: app.headline,
        profileImageUrl: app.profileImageUrl
      }
    }));
    
    return transformedApplications;
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
    try {
      const result = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          jobCount: sql<number>`COUNT(${jobs.id})`.as('jobCount')
        })
        .from(categories)
        .leftJoin(jobs, eq(categories.id, jobs.categoryId))
        .groupBy(categories.id, categories.name, categories.description)
        .orderBy(sql`COUNT(${jobs.id}) DESC`)
        .limit(20);
      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Fast jobs endpoint without resume counts for performance
  async getFastJobs(limit?: number) {
    try {
      let query = db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          isActive: jobs.isActive,
          createdAt: jobs.createdAt,
          companyId: jobs.companyId,
          categoryId: jobs.categoryId,
          recruiterId: jobs.recruiterId,
          companyName: companies.name,
          companyLogoUrl: companies.logoUrl,
          companyWebsite: companies.website,
          companyDescription: companies.description,
          categoryName: categories.name
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.createdAt));
      
      if (limit) {
        query = query.limit(limit) as any;
      }
      
      const fastJobsResults = await query;
      
      return fastJobsResults.map(job => ({
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
        createdAt: job.createdAt,
        companyId: job.companyId,
        categoryId: job.categoryId,
        recruiterId: job.recruiterId,
        company: {
          id: job.companyId,
          name: job.companyName || "Unknown Company",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription
        },
        category: {
          id: job.categoryId,
          name: job.categoryName || "General"
        },
        applicationCount: 0
      }));
    } catch (error) {
      console.error('Error fetching fast jobs:', error);
      return [];
    }
  },

  async getAdminJobs() {
    try {
      // First get the jobs with company and category data
      const adminJobsResults = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          isActive: jobs.isActive,
          createdAt: jobs.createdAt,
          companyId: jobs.companyId,
          categoryId: jobs.categoryId,
          recruiterId: jobs.recruiterId,
          companyName: companies.name,
          companyLogoUrl: companies.logoUrl,
          companyWebsite: companies.website,
          companyDescription: companies.description,
          categoryName: categories.name,
          city: jobs.city,
          state: jobs.state,
          zipCode: jobs.zipCode
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .orderBy(desc(jobs.createdAt));

      // Get vendor counts for each company
      const vendorCounts = await db
        .select({
          companyId: vendors.companyId,
          count: sql<number>`cast(count(*) as int)`
        })
        .from(vendors)
        .where(eq(vendors.status, 'approved'))
        .groupBy(vendors.companyId);

      console.log('🔍 Total vendors found:', vendorCounts.length);
      console.log('🔍 First few vendor counts:', vendorCounts.slice(0, 5));

      // Create lookup maps for efficient matching
      const vendorCountMap = new Map(vendorCounts.map(v => [v.companyId, v.count]));
      
      console.log('🔍 Vendor count map size:', vendorCountMap.size);
      
      // Get actual job application counts per job
      const applicationCounts = await db
        .select({
          jobId: jobApplications.jobId,
          count: sql<number>`cast(count(*) as int)`
        })
        .from(jobApplications)
        .groupBy(jobApplications.jobId);

      const applicationCountMap = new Map(applicationCounts.map(a => [a.jobId, a.count]));
      
      console.log('🔍 Application counts:', applicationCounts.slice(0, 5));
      console.log('🔍 Total jobs with applications:', applicationCounts.length);
      
      return adminJobsResults.map(job => {
        const realApplicants = applicationCountMap.get(job.id) || 0;
        console.log(`🔍 Job ${job.id} (${job.title}) - Real applications: ${realApplicants}`);
        
        return {
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
        city: job.city,
        state: job.state,
        zipCode: job.zipCode,
        vendorCount: vendorCountMap.get(job.companyId!) || 0,
        categoryResumeCount: 0, // Simplified - remove resume counting for now
        company: {
          id: job.companyId,
          name: job.companyName || "Unknown Company",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription
        },
        category: {
          id: job.categoryId,
          name: job.categoryName || "General"
        },
        applicationCount: realApplicants,
        categoryMatchedApplicants: realApplicants
      };
    });
    } catch (error) {
      console.error('Error fetching admin jobs:', error);
      return [];
    }
  },

  async getJobsByCategory(categoryId: number) {
    try {
      const categoryJobs = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.categoryId, categoryId), eq(jobs.isActive, true)));
      
      return categoryJobs;
    } catch (error) {
      console.error(`Error fetching jobs for category ${categoryId}:`, error);
      return [];
    }
  },

  async getJobById(jobId: number) {
    try {
      const jobResult = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          isActive: jobs.isActive,
          createdAt: jobs.createdAt,
          companyId: jobs.companyId,
          categoryId: jobs.categoryId,
          recruiterId: jobs.recruiterId,
          companyName: companies.name,
          companyLogoUrl: companies.logoUrl,
          companyWebsite: companies.website,
          companyDescription: companies.description,
          categoryName: categories.name
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (jobResult.length === 0) {
        return null;
      }

      const job = jobResult[0];
      return {
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        employmentType: job.employmentType,
        requirements: job.requirements,
        benefits: job.benefits,
        isActive: job.isActive,
        createdAt: job.createdAt,
        companyId: job.companyId,
        categoryId: job.categoryId,
        recruiterId: job.recruiterId,
        company: {
          id: job.companyId,
          name: job.companyName || "Unknown Company",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription
        },
        category: {
          id: job.categoryId,
          name: job.categoryName || "General"
        }
      };
    } catch (error) {
      console.error(`Error fetching job ${jobId}:`, error);
      return null;
    }
  },

  async getTopCompanies() {
    try {
      // Get companies with actual job counts using raw SQL
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.name,
          c.logo_url as "logoUrl",
          c.industry,
          c.location,
          c.description,
          c.user_id as "userId",
          c.approved_by as "approvedBy",
          c.created_at as "createdAt",
          COUNT(j.id)::int as "jobCount"
        FROM companies c
        LEFT JOIN jobs j ON c.id = j.company_id
        WHERE c.approved_by IS NOT NULL
        GROUP BY c.id, c.name, c.logo_url, c.industry, c.location, c.description, c.user_id, c.approved_by, c.created_at
        ORDER BY "jobCount" DESC
        LIMIT 20
      `);
      
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching top companies:', error);
      return [];
    }
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

  async searchCompanies(query: string, limit: number = 50) {
    try {
      const searchResults = await db
        .select({
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          industry: companies.industry,
          location: companies.location,
          description: companies.description,
          userId: companies.userId,
          approvedBy: companies.approvedBy,
          createdAt: companies.createdAt
        })
        .from(companies)
        .where(
          or(
            ilike(companies.name, `%${query}%`),
            ilike(companies.industry, `%${query}%`),
            ilike(companies.location, `%${query}%`),
            ilike(companies.description, `%${query}%`)
          )
        )
        .orderBy(companies.name)
        .limit(limit);

      return searchResults;
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  },

  // Manual assignment functions

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
  },

  // Get job applications for a specific job
  async getJobApplicationsForJob(jobId: number) {
    try {
      return await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.jobId, jobId));
    } catch (error) {
      console.error('Error fetching job applications for job:', error);
      return [];
    }
  },

  // Get job seekers for profiles sidebar
  async getJobSeekers() {
    try {
      return await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          headline: users.headline,
          categoryId: users.categoryId,
          profileImageUrl: users.profileImageUrl
        })
        .from(users)
        .where(eq(users.userType, 'job_seeker'))
        .limit(20);
    } catch (error) {
      console.error('Error fetching job seekers:', error);
      return [];
    }
  },

  // Get vendors for a specific job (via company relationship)
  async getJobVendors(jobId: number) {
    console.log(`🔍 Fetching vendors for job: ${jobId}`);
    
    try {
      const result = await db
        .select({
          id: vendors.id,
          name: vendors.name,
          email: vendors.email,
          phone: vendors.phone,
          services: vendors.services,
          status: vendors.status,
          companyId: vendors.companyId,
          logoUrl: companies.logoUrl,
          website: companies.website,
          location: companies.location,
          description: companies.description
        })
        .from(vendors)
        .innerJoin(companies, eq(vendors.companyId, companies.id))
        .innerJoin(jobs, eq(jobs.companyId, companies.id))
        .where(and(
          eq(jobs.id, jobId),
          eq(vendors.status, 'approved')
        ));

      console.log(`✅ Found ${result.length} vendors for job ${jobId}`);
      return result;
    } catch (error) {
      console.error('Error fetching job vendors:', error);
      return [];
    }
  },

  // Create a new vendor
  async createVendor(vendorData: any) {
    try {
      const [vendor] = await db.insert(vendors).values(vendorData).returning();
      console.log('✅ Created vendor:', vendor.id);
      return vendor;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }
};
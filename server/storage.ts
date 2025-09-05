import { db } from "./db";
import { eq, and, desc, sql, or, ilike, ne, isNull, isNotNull } from "drizzle-orm";
import { 
  users, 
  jobs, 
  companies, 
  categories, 
  jobApplications,
  jobCandidateAssignments,
  vendors,
  externalInvitations,
  experiences,
  education,
  skills,
  type UpsertUser,
  type InsertJob,
  type InsertCompany,
  type InsertJobApplication
} from "../shared/schema";
import fs from "fs";
import path from "path";

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
    
    // Note: Resume scoring will be implemented in a future update
    console.log('📝 Application created, resume scoring will be added later');
    
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

  // User management
  async getUserProfile(userId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) {
        return null;
      }
      
      // Transform the database fields to match the expected format
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: (user as any).bio || null,
        location: user.location || null,
        website: (user as any).website || null,
        phone: (user as any).phone || null,
        headline: user.headline,
        summary: user.summary,
        industry: user.industry,
        profileImageUrl: user.profileImageUrl,
        resumeUrl: user.resumeUrl,
        companyName: user.companyName || null,
        userType: user.userType,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        categoryId: user.categoryId,
        facebookUrl: user.facebookUrl,
        twitterUrl: user.twitterUrl,
        instagramUrl: user.instagramUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async createUser(userData: any) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('A user with this email already exists');
    }
    
    // Import the hashPassword function and hash the password
    const { hashPassword } = await import('./simple-auth');
    const hashedPassword = await hashPassword(userData.password);
    
    const cleanUserData = {
      id: userId,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType || 'job_seeker'
    };
    
    const [newUser] = await db.insert(users).values(cleanUserData).returning();
    return newUser;
  },

  async getUserApplications(userId: string, limit?: number) {
    console.log(`🔍 Fetching applications for user ID: ${userId}`);
    
    let applicationsQuery = db
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
        // Job information
        jobTitle: jobs.title,
        jobLocation: jobs.location,
        jobSalary: jobs.salary,
        jobEmploymentType: jobs.employmentType,
        jobRequirements: jobs.requirements,
        // Company information
        companyId: companies.id,
        companyName: companies.name,
        companyLogoUrl: companies.logoUrl,
        companyWebsite: companies.website
      })
      .from(jobApplications)
      .innerJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobApplications.applicantId, userId))
      .orderBy(desc(jobApplications.appliedAt));

    if (limit) {
      applicationsQuery = applicationsQuery.limit(limit) as any;
    }

    const rawApplications = await applicationsQuery;
    console.log(`Found ${rawApplications.length} applications for user ${userId}`);
    
    // Transform the data to include job and company objects
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
      createdAt: app.appliedAt, // For compatibility
      job: {
        id: app.jobId,
        title: app.jobTitle,
        location: app.jobLocation,
        salary: app.jobSalary,
        employmentType: app.jobEmploymentType,
        requirements: app.jobRequirements,
        company: {
          id: app.companyId,
          name: app.companyName || "Unknown Company",
          logoUrl: app.companyLogoUrl,
          website: app.companyWebsite
        }
      }
    }));
    
    return transformedApplications;
  },

  async updateApplicationScore(applicationId: number, scoreData: any) {
    console.log(`📊 Updating scores for application: ${applicationId}`);
    
    await db
      .update(jobApplications)
      .set({
        matchScore: scoreData.matchScore,
        skillsScore: scoreData.skillsScore,
        experienceScore: scoreData.experienceScore,
        educationScore: scoreData.educationScore,
        companyScore: scoreData.companyScore,
        isProcessed: scoreData.isProcessed
      })
      .where(eq(jobApplications.id, applicationId));
    
    console.log(`✅ Updated scores for application: ${applicationId}`);
  },

  async updateApplicationStatus(applicationId: number, status: string) {
    console.log(`📝 Updating status for application ${applicationId} to: ${status}`);
    
    await db
      .update(jobApplications)
      .set({
        status: status as any
      })
      .where(eq(jobApplications.id, applicationId));
    
    console.log(`✅ Updated application ${applicationId} status to: ${status}`);
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
        .orderBy(sql`COUNT(${jobs.id}) DESC`);
      
      console.log(`✅ Fetched ${result.length} categories (total: 139)`);
      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Fast jobs endpoint with application counts and location data
  async getFastJobs(limit?: number) {
    try {
      let query = db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          city: jobs.city,
          state: jobs.state,
          zipCode: jobs.zipCode,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          skills: jobs.skills,
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
          applicationCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${users} 
            WHERE ${users.userType} = 'job_seeker' AND ${users.categoryId} = ${jobs.categoryId}
          )`.as('applicationCount')
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
        city: job.city,
        state: job.state,
        zipCode: job.zipCode,
        salary: job.salary,
        employmentType: job.employmentType,
        requirements: job.requirements,
        benefits: job.benefits,
        skills: job.skills,
        applicationDeadline: null,
        isActive: job.isActive,
        postedAt: job.createdAt,
        createdAt: job.createdAt,
        updatedAt: job.createdAt,
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
        applicationCount: job.applicationCount || 0
      }));
    } catch (error) {
      console.error('Error fetching fast jobs:', error);
      return [];
    }
  },

  async getJobsFromTopCompanies(limit: number = 50) {
    try {
      // Get recent jobs from top companies (1 job per company)
      const result = await db.execute(sql`
        WITH top_companies AS (
          SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.website,
            c.description,
            COUNT(DISTINCT j.id) as job_count,
            COUNT(DISTINCT v.id) as vendor_count
          FROM companies c
          LEFT JOIN jobs j ON c.id = j.company_id AND j.is_active = true
          LEFT JOIN vendors v ON c.id = v.company_id AND v.status = 'approved'
          WHERE c.approved_by IS NOT NULL
          GROUP BY c.id, c.name, c.logo_url, c.website, c.description
          HAVING COUNT(DISTINCT j.id) > 0
          ORDER BY job_count DESC, vendor_count DESC
          LIMIT ${limit}
        ),
        latest_jobs AS (
          SELECT 
            j.*,
            tc.name as company_name,
            tc.logo_url as company_logo_url,
            tc.website as company_website,
            tc.description as company_description,
            tc.job_count,
            cat.name as category_name,
            (SELECT COUNT(*) FROM users u WHERE u.user_type = 'job_seeker' AND u.category_id = j.category_id) as app_count,
            ROW_NUMBER() OVER (PARTITION BY j.company_id ORDER BY GREATEST(j.created_at, j.updated_at) DESC) as rn
          FROM jobs j
          INNER JOIN top_companies tc ON j.company_id = tc.id
          LEFT JOIN categories cat ON j.category_id = cat.id
          WHERE j.is_active = true
        )
        SELECT 
          id,
          title,
          description,
          location,
          city,
          state,
          zip_code,
          salary,
          employment_type,
          requirements,
          benefits,
          skills,
          is_active,
          created_at,
          updated_at,
          company_id,
          category_id,
          recruiter_id,
          company_name,
          company_logo_url,
          company_website,
          company_description,
          category_name,
          job_count,
          app_count
        FROM latest_jobs 
        WHERE rn = 1
        ORDER BY job_count DESC
      `);
      
      return result.rows.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        city: job.city,
        state: job.state,
        zipCode: job.zip_code,
        salary: job.salary,
        employmentType: job.employment_type,
        requirements: job.requirements,
        benefits: job.benefits,
        skills: job.skills,
        applicationDeadline: null,
        isActive: job.is_active,
        postedAt: job.created_at,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        companyId: job.company_id,
        categoryId: job.category_id,
        recruiterId: job.recruiter_id,
        company: {
          id: job.company_id,
          name: job.company_name || "Unknown Company",
          logoUrl: job.company_logo_url,
          website: job.company_website,
          description: job.company_description
        },
        category: {
          id: job.category_id,
          name: job.category_name || "General"
        },
        applicationCount: Number(job.app_count) || 0,
        companyJobCount: job.job_count
      }));
    } catch (error) {
      console.error('Error fetching jobs from top companies:', error);
      return [];
    }
  },

  async getAdminJobs(limit?: number, offset?: number) {
    try {
      // First get the jobs with company and category data
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
          updatedAt: jobs.updatedAt,
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
          zipCode: jobs.zipCode,
          applicationCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${users} 
            WHERE ${users.userType} = 'job_seeker' AND ${users.categoryId} = ${jobs.categoryId}
          )`.as('applicationCount')
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .orderBy(desc(jobs.updatedAt), desc(jobs.createdAt));

      // Apply pagination if provided
      if (limit) {
        query = query.limit(limit) as any;
      }
      if (offset) {
        query = query.offset(offset) as any;
      }

      const adminJobsResults = await query;

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
      
      // Get job seeker counts by category (for categoryMatchedApplicants)
      const categoryApplicantCounts = await db
        .select({
          categoryId: users.categoryId,
          count: sql<number>`cast(count(*) as int)`
        })
        .from(users)
        .where(eq(users.userType, 'job_seeker'))
        .groupBy(users.categoryId);

      const categoryApplicantMap = new Map(categoryApplicantCounts.map(c => [c.categoryId, c.count]));
      
      console.log('🔍 Application counts:', applicationCounts.slice(0, 5));
      console.log('🔍 Total jobs with applications:', applicationCounts.length);
      console.log('🔍 Category applicant counts:', categoryApplicantCounts.slice(0, 5));
      
      return adminJobsResults.map(job => {
        const realApplicants = applicationCountMap.get(job.id) || 0;
        const categoryMatchedApplicants = categoryApplicantMap.get(job.categoryId!) || 0;
        console.log(`🔍 Job ${job.id} (${job.title}) - Real applications: ${realApplicants}, Category applicants: ${categoryMatchedApplicants}`);
        
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
        applicationCount: realApplicants + categoryMatchedApplicants, // FIXED: Combine real applications + category matches
        company: {
          id: job.companyId,
          name: job.companyName || "Unknown Company",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription,
          city: job.city,
          state: job.state,
          zipCode: job.zipCode,
          vendorCount: vendorCountMap.get(job.companyId!) || 0
        },
        category: {
          id: job.categoryId,
          name: job.categoryName || "General"
        }
      };
    });
    } catch (error) {
      console.error('Error fetching admin jobs:', error);
      return [];
    }
  },

  // Get recruiter jobs (jobs posted by recruiters, not admins)
  async getRecruiterJobs(limit?: number) {
    try {
      let query = db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          city: jobs.city,
          state: jobs.state,
          zipCode: jobs.zipCode,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          skills: jobs.skills,
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
          applicationCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${users} 
            WHERE ${users.userType} = 'job_seeker' AND ${users.categoryId} = ${jobs.categoryId}
          )`.as('applicationCount')
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .leftJoin(categories, eq(jobs.categoryId, categories.id))
        .leftJoin(users, eq(jobs.recruiterId, users.id))
        .where(and(
          eq(jobs.isActive, true),
          eq(users.userType, 'recruiter') // Only jobs from recruiters
        ))
        .orderBy(desc(jobs.createdAt));
      
      if (limit) {
        query = query.limit(limit) as any;
      }
      
      const recruiterJobsResults = await query;
      
      return recruiterJobsResults.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        city: job.city,
        state: job.state,
        zipCode: job.zipCode,
        salary: job.salary,
        employmentType: job.employmentType,
        requirements: job.requirements,
        benefits: job.benefits,
        skills: job.skills,
        applicationDeadline: null,
        isActive: job.isActive,
        postedAt: job.createdAt,
        createdAt: job.createdAt,
        updatedAt: job.createdAt,
        companyId: job.companyId,
        categoryId: job.categoryId,
        recruiterId: job.recruiterId,
        vendorCount: 0, // Add missing property
        categoryResumeCount: 0, // Add missing property
        company: {
          id: job.companyId,
          name: job.companyName || "Unknown Company",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription,
          city: job.city,
          state: job.state,
          zipCode: job.zipCode,
          vendorCount: 0
        },
        category: {
          id: job.categoryId,
          name: job.categoryName || "General"
        },
        applicationCount: job.applicationCount || 0
      }));
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error);
      return [];
    }
  },

  async getJobsByCategory(categoryId: number) {
    try {
      const categoryJobs = await db
        .select({
          id: jobs.id,
          companyId: jobs.companyId,
          recruiterId: jobs.recruiterId,
          categoryId: jobs.categoryId,
          title: jobs.title,
          description: jobs.description,
          requirements: jobs.requirements,
          location: jobs.location,
          country: jobs.country,
          state: jobs.state,
          city: jobs.city,
          zipCode: jobs.zipCode,
          jobType: jobs.jobType,
          employmentType: jobs.employmentType,
          experienceLevel: jobs.experienceLevel,
          salary: jobs.salary,
          benefits: jobs.benefits,
          skills: jobs.skills,
          isActive: jobs.isActive,
          applicationCount: jobs.applicationCount,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
          companyName: companies.name,
          companyLogoUrl: companies.logoUrl,
          companyWebsite: companies.website,
          companyDescription: companies.description
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(and(eq(jobs.categoryId, categoryId), eq(jobs.isActive, true)))
        .orderBy(desc(jobs.createdAt));
      
      // Transform the results to include company object
      return categoryJobs.map(job => ({
        ...job,
        company: {
          id: job.companyId,
          name: job.companyName || "Company Name",
          logoUrl: job.companyLogoUrl,
          website: job.companyWebsite,
          description: job.companyDescription
        }
      }));
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
          categoryName: categories.name,
          applicationCount: sql<number>`(
            SELECT COUNT(*) FROM ${users} 
            WHERE ${users.userType} = 'job_seeker' AND ${users.categoryId} = ${jobs.categoryId}
          )`.as('applicationCount')
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
        },
        applicationCount: job.applicationCount || 0
      };
    } catch (error) {
      console.error(`Error fetching job ${jobId}:`, error);
      return null;
    }
  },

  async getTopCompanies() {
    try {
      // Get companies with actual job counts and vendor counts using raw SQL
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
          COUNT(DISTINCT j.id)::int as "jobCount",
          COUNT(DISTINCT v.id)::int as "vendor_count"
        FROM companies c
        LEFT JOIN jobs j ON c.id = j.company_id
        LEFT JOIN vendors v ON c.id = v.company_id AND v.status = 'approved'
        WHERE c.approved_by IS NOT NULL
        GROUP BY c.id, c.name, c.logo_url, c.industry, c.location, c.description, c.user_id, c.approved_by, c.created_at
        ORDER BY "jobCount" DESC
        LIMIT 100
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
    const [activeJobCount] = await db.select({ count: sql`count(*)` }).from(jobs).where(eq(jobs.isActive, true));
    const [todayJobCount] = await db.select({ count: sql`count(*)` }).from(jobs).where(sql`DATE(created_at) = CURRENT_DATE`);
    const [todayUpdatedCount] = await db.select({ count: sql`count(*)` }).from(jobs).where(sql`DATE(updated_at) = CURRENT_DATE`);
    
    // Start from 200 and add daily additions/edits
    const dailyActivity = Number(todayJobCount.count) + Number(todayUpdatedCount.count);
    const todayJobsDisplay = 200 + dailyActivity;
    
    return {
      totalUsers: Number(userCount.count),
      totalCompanies: Number(companyCount.count), 
      totalJobs: Number(activeJobCount.count),
      activeJobs: Number(activeJobCount.count),
      todayJobs: todayJobsDisplay
    };
  },

  async getJobsByRecruiterId(recruiterId: string) {
    try {
      console.log('🔐 Fetching jobs for recruiter:', recruiterId);
      
      const recruiterJobs = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.recruiterId, recruiterId), eq(jobs.isActive, true)))
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

  async getCompanies(limit: number = 100, offset: number = 0) {
    try {
      const result = await db
        .select()
        .from(companies)
        .orderBy(companies.name)
        .limit(limit)
        .offset(offset);
      
      console.log(`✅ Fetched ${result.length} companies (limit: ${limit}, offset: ${offset})`);
      return result;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
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
          and(
            eq(companies.status, 'approved'),
            or(
              ilike(companies.name, `%${query}%`),
              ilike(companies.industry, `%${query}%`),
              ilike(companies.location, `%${query}%`),
              ilike(companies.description, `%${query}%`)
            )
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

  async searchJobs(query: string, limit: number = 50) {
    try {
      console.log('🔍 Searching jobs for query:', query);
      
      // Split query into individual terms (e.g., "azure 89119" -> ["azure", "89119"])
      const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
      
      // Build conditions for each term - each term must match at least one field INCLUDING company name
      const termConditions = searchTerms.map(term => 
        or(
          ilike(jobs.title, `%${term}%`),
          ilike(jobs.description, `%${term}%`),
          ilike(jobs.location, `%${term}%`),
          ilike(jobs.city, `%${term}%`),
          ilike(jobs.state, `%${term}%`),
          ilike(jobs.zipCode, `%${term}%`),
          ilike(jobs.requirements, `%${term}%`),
          ilike(companies.name, `%${term}%`)  // ADDED: Search in company name
        )
      );
      
      // For company searches, use OR logic if terms seem to be parts of a company name
      // Check if the query looks like a company name (multiple words, common company terms)
      const companyKeywords = ['inc', 'corp', 'llc', 'ltd', 'company', 'companies', 'group', 'solutions', 'systems', 'technologies', 'services', 'investments', 'financial', 'bank', 'consulting'];
      const hasCompanyKeyword = searchTerms.some(term => 
        companyKeywords.includes(term.toLowerCase())
      );
      
      // Use OR logic for likely company searches, AND logic for skill/job searches
      const searchCondition = (searchTerms.length > 1 && hasCompanyKeyword)
        ? and(eq(jobs.isActive, true), or(...termConditions))  // Company search - any term can match
        : searchTerms.length > 1 
          ? and(eq(jobs.isActive, true), ...termConditions)    // Multi-term job search - all must match
          : and(eq(jobs.isActive, true), termConditions[0]);   // Single term - must match

      const searchResults = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          city: jobs.city,
          state: jobs.state,
          zipCode: jobs.zipCode,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          companyId: jobs.companyId,
          categoryId: jobs.categoryId,
          isActive: jobs.isActive,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
          applicationCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${users} 
            WHERE ${users.userType} = 'job_seeker' AND ${users.categoryId} = ${jobs.categoryId}
          )`.as('applicationCount'),
          resumeCount: sql<number>`(
            SELECT COUNT(*) 
            FROM ${jobApplications} ja
            WHERE ja.job_id = ${jobs.id} AND ja.resume_url IS NOT NULL
          )`.as('resumeCount'),
          company: {
            id: companies.id,
            name: companies.name,
            logoUrl: companies.logoUrl,
            location: companies.location,
            industry: companies.industry
          }
        })
        .from(jobs)
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(searchCondition)
        .orderBy(desc(jobs.createdAt))
        .limit(limit);

      console.log(`🔍 Found ${searchResults.length} jobs for query "${query}" (terms: ${searchTerms.join(', ')})`);
      
      return searchResults;
    } catch (error) {
      console.error('Error searching jobs:', error);
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
      // Simple approach - get all job seekers, let frontend filter
      const result = await db
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
        .where(eq(users.userType, 'job_seeker'));
        
      
      return result;
    } catch (error) {
      console.error('Error fetching job seekers:', error);
      return [];
    }
  },

  // Get vendors for a specific job (via job_vendors table or company relationship)
  async getJobVendors(jobId: number) {
    console.log(`🔍 Fetching vendors for job: ${jobId}`);
    
    try {
      // First try the job_vendors table for proper vendor associations
      const jobVendorResult = await db.execute(sql`
        SELECT v.id, v.name, v.phone, v.services, v.status, v.company_id,
               v.vendor_city, v.vendor_state, v.vendor_zip_code, v.vendor_address,
               c.city as company_city, c.state as company_state, c.zip_code as company_zip_code, 
               c.location as company_address, c.website
        FROM vendors v
        JOIN job_vendors jv ON v.id = jv.vendor_id
        JOIN companies c ON v.company_id = c.id
        WHERE jv.job_id = ${jobId}
        ORDER BY v.created_at DESC
      `);

      if (jobVendorResult.rows && jobVendorResult.rows.length > 0) {
        console.log(`✅ Found ${jobVendorResult.rows.length} vendors via job_vendors for job ${jobId}`);
        return jobVendorResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          services: row.services,
          status: row.status,
          companyId: row.company_id,
          city: (row.vendor_city && row.vendor_city !== 'NULL' && row.vendor_city.trim() !== '') ? row.vendor_city : row.company_city,
          state: (row.vendor_state && row.vendor_state !== 'NULL' && row.vendor_state.trim() !== '') ? row.vendor_state : row.company_state,
          zipCode: (row.vendor_zip_code && row.vendor_zip_code !== 'NULL' && row.vendor_zip_code.trim() !== '') ? row.vendor_zip_code : row.company_zip_code,
          address: (row.vendor_address && row.vendor_address !== 'NULL' && row.vendor_address.trim() !== '') ? row.vendor_address : row.company_address,
          website: row.website
        }));
      }

      // Fallback to old method if no job_vendors associations exist
      const result = await db
        .select({
          id: vendors.id,
          name: vendors.name,
          phone: vendors.phone,
          services: vendors.services,
          status: vendors.status,
          companyId: vendors.companyId,
          createdAt: vendors.createdAt,
          vendorCity: vendors.vendorCity,
          vendorState: vendors.vendorState,
          vendorZipCode: vendors.vendorZipCode,
          vendorAddress: vendors.vendorAddress,
          companyCity: companies.city,
          companyState: companies.state,
          companyZipCode: companies.zipCode,
          companyAddress: companies.location,
          website: companies.website
        })
        .from(vendors)
        .innerJoin(companies, eq(vendors.companyId, companies.id))
        .innerJoin(jobs, eq(jobs.companyId, companies.id))
        .where(and(
          eq(jobs.id, jobId),
          eq(vendors.status, 'approved')
        ));

      console.log(`✅ Found ${result.length} vendors via fallback for job ${jobId}`);
      return result.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        services: vendor.services,
        status: vendor.status,
        companyId: vendor.companyId,
        createdAt: vendor.createdAt,
        city: (vendor.vendorCity && vendor.vendorCity !== 'NULL' && vendor.vendorCity.trim() !== '') ? vendor.vendorCity : vendor.companyCity,
        state: (vendor.vendorState && vendor.vendorState !== 'NULL' && vendor.vendorState.trim() !== '') ? vendor.vendorState : vendor.companyState,
        zipCode: (vendor.vendorZipCode && vendor.vendorZipCode !== 'NULL' && vendor.vendorZipCode.trim() !== '') ? vendor.vendorZipCode : vendor.companyZipCode,
        address: (vendor.vendorAddress && vendor.vendorAddress !== 'NULL' && vendor.vendorAddress.trim() !== '') ? vendor.vendorAddress : vendor.companyAddress,
        website: vendor.website
      }));
    } catch (error) {
      console.error('Error fetching job vendors:', error);
      return [];
    }
  },

  // Create a new vendor
  async createVendor(vendorData: any) {
    try {
      // Only use columns that exist in the actual database
      const vendorToCreate = {
        companyId: vendorData.companyId,
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone,
        services: vendorData.services,
        status: vendorData.status || 'pending'
      };
      
      const [vendor] = await db.insert(vendors).values(vendorToCreate).returning();
      console.log('✅ Created vendor:', vendor.id);
      return vendor;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Get vendors for a specific company
  async getCompanyVendors(companyId: number) {
    try {
      const result = await db
        .select({
          id: vendors.id,
          name: vendors.name,
          email: vendors.email,
          phone: vendors.phone,
          services: vendors.services,
          status: vendors.status,
          createdAt: vendors.createdAt
        })
        .from(vendors)
        .where(eq(vendors.companyId, companyId))
        .orderBy(vendors.createdAt);

      console.log(`✅ Found ${result.length} vendors for company ${companyId}`);
      return result;
    } catch (error) {
      console.error('Error fetching company vendors:', error);
      return [];
    }
  },

  // Get pending companies for admin approval
  async getPendingCompanies() {
    try {
      const result = await db
        .select()
        .from(companies)
        .where(eq(companies.status, 'pending'))
        .orderBy(companies.createdAt);

      console.log(`✅ Found ${result.length} pending companies`);
      return result;
    } catch (error) {
      console.error('Error fetching pending companies:', error);
      return [];
    }
  },

  // Get pending vendors for admin approval
  async getPendingVendors() {
    try {
      const result = await db
        .select({
          id: vendors.id,
          companyId: vendors.companyId,
          name: vendors.name,
          email: vendors.email,
          phone: vendors.phone,
          services: vendors.services,
          status: vendors.status,
          createdAt: vendors.createdAt,
          companyName: companies.name
        })
        .from(vendors)
        .innerJoin(companies, eq(vendors.companyId, companies.id))
        .where(eq(vendors.status, 'pending'))
        .orderBy(vendors.createdAt);

      console.log(`✅ Found ${result.length} pending vendors`);
      return result;
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
      return [];
    }
  },

  // Update vendor status (approve/reject)
  async updateVendorStatus(vendorId: number, status: string, approvedBy?: number) {
    try {
      const updateData: any = { status };
      if (approvedBy) {
        updateData.approvedBy = approvedBy;
      }

      const [updatedVendor] = await db
        .update(vendors)
        .set(updateData)
        .where(eq(vendors.id, vendorId))
        .returning();

      console.log(`✅ Updated vendor ${vendorId} status to ${status}`);
      return updatedVendor;
    } catch (error) {
      console.error('Error updating vendor status:', error);
      throw error;
    }
  },

  // Get company by ID
  async getCompanyById(companyId: number) {
    try {
      const result = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching company by ID:', error);
      return null;
    }
  },

  // Get jobs for a specific company
  async getCompanyJobs(companyId: number) {
    try {
      const result = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          description: jobs.description,
          location: jobs.location,
          city: jobs.city,
          state: jobs.state,
          zipCode: jobs.zipCode,
          country: jobs.country,
          salary: jobs.salary,
          employmentType: jobs.employmentType,
          experienceLevel: jobs.experienceLevel,
          skills: jobs.skills,
          requirements: jobs.requirements,
          benefits: jobs.benefits,
          isActive: jobs.isActive,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
          categoryId: jobs.categoryId,
          recruiterId: jobs.recruiterId
        })
        .from(jobs)
        .where(and(eq(jobs.companyId, companyId), eq(jobs.isActive, true)))
        .orderBy(desc(jobs.createdAt));

      console.log(`✅ Found ${result.length} active jobs for company ${companyId}`);
      return result;
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      return [];
    }
  },

  // Create a new company
  async createCompany(companyData: InsertCompany) {
    try {
      console.log('Creating company with data:', companyData);
      
      const [company] = await db.insert(companies).values(companyData).returning();
      console.log('✅ Created company:', company.id);
      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },

  // Update an existing company
  async updateCompany(companyId: number, companyData: any) {
    try {
      console.log('Updating company:', companyId, 'with data:', companyData);
      
      const [updatedCompany] = await db
        .update(companies)
        .set(companyData)
        .where(eq(companies.id, companyId))
        .returning();
      
      console.log('✅ Updated company:', companyId);
      return updatedCompany;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  // Update an existing job
  async updateJob(jobId: number, jobData: any) {
    try {
      console.log('Updating job:', jobId, 'with data:', jobData);
      
      // Filter out undefined/null values
      const cleanData = Object.fromEntries(
        Object.entries(jobData).filter(([key, value]) => 
          value !== undefined && value !== null
        )
      );

      // Always set updatedAt to current timestamp
      cleanData.updatedAt = new Date();

      const [updatedJob] = await db
        .update(jobs)
        .set(cleanData)
        .where(eq(jobs.id, jobId))
        .returning();
      
      console.log('✅ Updated job:', jobId);
      return updatedJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Create a new job
  async createJob(jobData: any) {
    try {
      console.log('Creating job with data:', jobData);
      
      // Prepare job data for database insertion
      const cleanData = {
        companyId: jobData.companyId,
        recruiterId: jobData.recruiterId,
        categoryId: jobData.categoryId,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        country: jobData.country,
        state: jobData.state,
        city: jobData.city,
        zipCode: jobData.zipCode,
        jobType: jobData.jobType,
        employmentType: jobData.employmentType,
        experienceLevel: jobData.experienceLevel,
        salary: jobData.salary,
        benefits: jobData.benefits,
        skills: jobData.skills || [],
        isActive: true
      };

      const [job] = await db.insert(jobs).values(cleanData).returning();
      console.log('✅ Created job:', job.id);
      return job;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  async deleteJob(jobId: number) {
    try {
      console.log('Soft deleting job (marking inactive):', jobId);
      
      // Instead of hard delete, mark the job as inactive
      const updatedJob = await db
        .update(jobs)
        .set({ isActive: false })
        .where(eq(jobs.id, jobId))
        .returning();
      
      console.log('Marked job as inactive:', updatedJob);
      
      return updatedJob[0];
    } catch (error) {
      console.error('Error soft deleting job:', error);
      throw error;
    }
  },

  // Messaging functionality
  async getConversations(userId: string) {
    try {
      const result = await db.execute(sql`
        WITH conversation_partners AS (
          SELECT DISTINCT
            CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END as other_user_id,
            MAX(m.sent_at) as last_message_time
          FROM messages m
          WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
          GROUP BY other_user_id
        ),
        last_messages AS (
          SELECT DISTINCT ON (other_user_id)
            other_user_id,
            content as last_message
          FROM (
            SELECT 
              CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END as other_user_id,
              m.content,
              m.sent_at
            FROM messages m
            WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
            ORDER BY 
              CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END,
              m.sent_at DESC
          ) sub
        )
        SELECT 
          cp.other_user_id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          u.headline,
          cp.last_message_time,
          lm.last_message,
          COALESCE((
            SELECT COUNT(*) 
            FROM messages m3 
            WHERE m3.receiver_id = ${userId} 
              AND m3.sender_id = cp.other_user_id 
              AND m3.read_at IS NULL
          ), 0) as unread_count
        FROM conversation_partners cp
        JOIN users u ON u.id = cp.other_user_id
        LEFT JOIN last_messages lm ON lm.other_user_id = cp.other_user_id
        ORDER BY cp.last_message_time DESC
      `);
      
      return result.rows.map((row: any) => ({
        otherUser: {
          id: row.other_user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
          headline: row.headline
        },
        lastMessage: row.last_message,
        lastMessageTime: row.last_message_time,
        unreadCount: parseInt(row.unread_count) || 0
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  async getMessages(senderId: string, receiverId: string) {
    try {
      const result = await db.execute(sql`
        SELECT 
          m.id,
          m.sender_id,
          m.receiver_id,
          m.content,
          m.read_at,
          m.sent_at,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name,
          u.profile_image_url as sender_profile_image
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = ${senderId} AND m.receiver_id = ${receiverId}) OR
              (m.sender_id = ${receiverId} AND m.receiver_id = ${senderId})
        ORDER BY m.sent_at ASC
      `);
      
      // Mark messages as read for the current user
      await db.execute(sql`
        UPDATE messages 
        SET read_at = NOW() 
        WHERE receiver_id = ${senderId} AND sender_id = ${receiverId} AND read_at IS NULL
      `);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        isRead: row.read_at !== null,
        createdAt: row.sent_at,
        sender: {
          firstName: row.sender_first_name,
          lastName: row.sender_last_name,
          profileImageUrl: row.sender_profile_image
        }
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    try {
      const result = await db.execute(sql`
        INSERT INTO messages (sender_id, receiver_id, content, sent_at)
        VALUES (${senderId}, ${receiverId}, ${content}, NOW())
        RETURNING id, sender_id, receiver_id, content, sent_at
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getUnreadMessageCount(userId: string) {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM messages
        WHERE receiver_id = ${userId} AND read_at IS NULL
      `);
      
      return parseInt(result.rows[0]?.count as string) || 0;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      return 0;
    }
  },

  async deleteConversation(userId: string, otherUserId: string) {
    try {
      // Delete all messages between the two users
      await db.execute(sql`
        DELETE FROM messages 
        WHERE (sender_id = ${userId} AND receiver_id = ${otherUserId}) OR
              (sender_id = ${otherUserId} AND receiver_id = ${userId})
      `);
      
      console.log(`Deleted conversation between ${userId} and ${otherUserId}`);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  async getConnections(userId: string) {
    try {
      // Based on the actual connections table structure: sender_id, receiver_id, status
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          u.headline,
          u.user_type
        FROM connections c
        JOIN users u ON (u.id = c.sender_id OR u.id = c.receiver_id)
        WHERE (c.sender_id = ${userId} OR c.receiver_id = ${userId}) 
          AND c.status = 'accepted'
          AND u.id != ${userId}
      `);
      
      return result.rows.map((row: any) => ({
        user: {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          profileImageUrl: row.profile_image_url,
          headline: row.headline,
          userType: row.user_type
        }
      }));
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  },

  // External invitation methods
  async createExternalInvitation(data: any) {
    const [invitation] = await db.insert(externalInvitations).values({
      inviterUserId: data.inviterUserId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      message: data.message,
      inviteToken: data.inviteToken,
      expiresAt: data.expiresAt,
      status: data.status || 'pending'
    }).returning();
    return invitation;
  },

  async getExternalInvitationByToken(token: string) {
    const [invitation] = await db.select().from(externalInvitations)
      .where(eq(externalInvitations.inviteToken, token));
    return invitation;
  },

  async getExternalInvitations() {
    return await db.select().from(externalInvitations);
  },

  async updateExternalInvitationStatus(token: string, status: 'pending' | 'accepted' | 'declined' | 'expired') {
    const [invitation] = await db.update(externalInvitations)
      .set({ status })
      .where(eq(externalInvitations.inviteToken, token))
      .returning();
    return invitation;
  },

  // Profile sections - Experience, Education, Skills
  async addExperience(userId: string, experienceData: any) {
    try {
      const [experience] = await db.insert(experiences).values({
        userId,
        title: experienceData.title,
        company: experienceData.company,
        location: experienceData.location,
        startDate: new Date(experienceData.startDate),
        endDate: experienceData.endDate ? new Date(experienceData.endDate) : null,
        isCurrent: experienceData.isCurrent || false,
        description: experienceData.description
      }).returning();
      
      return experience;
    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  },

  async addEducation(userId: string, educationData: any) {
    try {
      const [edu] = await db.insert(education).values({
        userId,
        institution: educationData.institution,
        degree: educationData.degree,
        fieldOfStudy: educationData.fieldOfStudy,
        startDate: new Date(educationData.startDate),
        endDate: educationData.endDate ? new Date(educationData.endDate) : null,
        grade: educationData.grade,
        description: educationData.description
      }).returning();
      
      return edu;
    } catch (error) {
      console.error('Error adding education:', error);
      throw error;
    }
  },

  async addSkill(userId: string, skillData: any) {
    try {
      const [skill] = await db.insert(skills).values({
        userId,
        name: skillData.name,
        endorsements: skillData.endorsements || 0
      }).returning();
      
      return skill;
    } catch (error) {
      console.error('Error adding skill:', error);
      throw error;
    }
  }
};
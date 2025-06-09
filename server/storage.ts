import {
  users,
  experiences,
  education,
  skills,
  companies,
  jobs,
  jobApplications,
  connections,
  messages,
  groups,
  groupMemberships,
  vendors,
  categories,
  countries,
  states,
  cities,
  type User,
  type UpsertUser,
  type Experience,
  type InsertExperience,
  type Education,
  type InsertEducation,
  type Skill,
  type InsertSkill,
  type Company,
  type InsertCompany,
  type Job,
  type InsertJob,
  type JobApplication,
  type InsertJobApplication,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
  type Group,
  type InsertGroup,
  type Vendor,
  type InsertVendor,
  type Category,
  type InsertCategory,
  type Country,
  type State,
  type City,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(id: string): Promise<any>;
  updateUserProfile(id: string, data: Partial<UpsertUser>): Promise<User>;
  
  // Experience operations
  getUserExperiences(userId: string): Promise<Experience[]>;
  addExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: number, experience: Partial<InsertExperience>): Promise<Experience>;
  deleteExperience(id: number): Promise<void>;
  
  // Education operations
  getUserEducation(userId: string): Promise<Education[]>;
  addEducation(education: InsertEducation): Promise<Education>;
  updateEducation(id: number, education: Partial<InsertEducation>): Promise<Education>;
  deleteEducation(id: number): Promise<void>;
  
  // Skills operations
  getUserSkills(userId: string): Promise<Skill[]>;
  addSkill(skill: InsertSkill): Promise<Skill>;
  deleteSkill(id: number): Promise<void>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getUserCompany(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  getCompanies(limit?: number): Promise<Company[]>;
  searchCompanies(query: string, limit?: number): Promise<Company[]>;
  getPendingCompanies(): Promise<Company[]>;
  updateCompanyStatus(id: number, status: string, approvedBy?: string): Promise<Company>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobs(filters?: any, limit?: number): Promise<Job[]>;
  getJobsByCompany(companyId: number): Promise<Job[]>;
  getJobsByRecruiter(recruiterId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  searchJobs(query: string, filters?: any): Promise<Job[]>;
  
  // Job Application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getUserJobApplications(userId: string): Promise<any[]>;
  getJobApplications(jobId: number): Promise<any[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication>;
  
  // Connection operations
  getUserConnections(userId: string): Promise<any[]>;
  getConnectionRequests(userId: string): Promise<any[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection>;
  
  // Message operations
  getUserMessages(userId: string, otherUserId: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Group operations
  getGroups(limit?: number): Promise<Group[]>;
  getUserGroups(userId: string): Promise<any[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  
  // Vendor operations
  getClientVendors(clientId: number): Promise<any[]>;
  addVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendorStatus(id: number, status: string, approvedBy?: string): Promise<Vendor>;
  getPendingVendors(): Promise<any[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Location operations
  getCountries(): Promise<Country[]>;
  getStatesByCountry(countryId: number): Promise<State[]>;
  getCitiesByState(stateId: number): Promise<City[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          userType: userData.userType,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(id: string): Promise<any> {
    const user = await this.getUser(id);
    if (!user) return null;

    const userExperiences = await this.getUserExperiences(id);
    const userEducation = await this.getUserEducation(id);
    const userSkills = await this.getUserSkills(id);
    const userCompany = await this.getUserCompany(id);

    return {
      ...user,
      experiences: userExperiences,
      education: userEducation,
      skills: userSkills,
      company: userCompany,
    };
  }

  async updateUserProfile(id: string, data: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Experience operations
  async getUserExperiences(userId: string): Promise<Experience[]> {
    return await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, userId))
      .orderBy(desc(experiences.startDate));
  }

  async addExperience(experience: InsertExperience): Promise<Experience> {
    const [result] = await db.insert(experiences).values(experience).returning();
    return result;
  }

  async updateExperience(id: number, experience: Partial<InsertExperience>): Promise<Experience> {
    const [result] = await db
      .update(experiences)
      .set(experience)
      .where(eq(experiences.id, id))
      .returning();
    return result;
  }

  async deleteExperience(id: number): Promise<void> {
    await db.delete(experiences).where(eq(experiences.id, id));
  }

  // Education operations
  async getUserEducation(userId: string): Promise<Education[]> {
    return await db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(desc(education.startDate));
  }

  async addEducation(educationData: InsertEducation): Promise<Education> {
    const [result] = await db.insert(education).values(educationData).returning();
    return result;
  }

  async updateEducation(id: number, educationData: Partial<InsertEducation>): Promise<Education> {
    const [result] = await db
      .update(education)
      .set(educationData)
      .where(eq(education.id, id))
      .returning();
    return result;
  }

  async deleteEducation(id: number): Promise<void> {
    await db.delete(education).where(eq(education.id, id));
  }

  // Skills operations
  async getUserSkills(userId: string): Promise<Skill[]> {
    return await db
      .select()
      .from(skills)
      .where(eq(skills.userId, userId))
      .orderBy(desc(skills.endorsements));
  }

  async addSkill(skill: InsertSkill): Promise<Skill> {
    const [result] = await db.insert(skills).values(skill).returning();
    return result;
  }

  async deleteSkill(id: number): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getUserCompany(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [result] = await db.insert(companies).values(company).returning();
    return result;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [result] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return result;
  }

  async getCompanies(limit = 50000): Promise<Company[]> {
    if (limit === 50000) {
      // For unlimited requests, return all approved companies
      return await db
        .select()
        .from(companies)
        .where(eq(companies.status, 'approved'))
        .orderBy(desc(companies.followers));
    }
    return await db
      .select()
      .from(companies)
      .where(eq(companies.status, 'approved'))
      .orderBy(desc(companies.followers))
      .limit(limit);
  }

  async searchCompanies(query: string, limit = 50000): Promise<Company[]> {
    console.log(`DEBUG: searchCompanies called with query="${query}", limit=${limit}`);
    
    // Search across multiple fields: name, city, state, zipCode, industry, description
    const searchCondition = or(
      sql`LOWER(${companies.name}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.city}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.state}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.zipCode}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.industry}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.description}) LIKE LOWER(${'%' + query + '%'})`,
      sql`LOWER(${companies.location}) LIKE LOWER(${'%' + query + '%'})`
    );
    
    let results: Company[];
    if (limit === 50000) {
      // For unlimited searches, return all matching approved companies
      results = await db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.status, 'approved'),
            searchCondition
          )
        )
        .orderBy(desc(companies.followers));
    } else {
      results = await db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.status, 'approved'),
            searchCondition
          )
        )
        .orderBy(desc(companies.followers))
        .limit(limit);
    }
    
    console.log(`DEBUG: searchCompanies returned ${results.length} results for "${query}"`);
    return results;
  }

  async getPendingCompanies(): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.status, 'pending'))
      .orderBy(desc(companies.createdAt));
  }

  async updateCompanyStatus(id: number, status: string, approvedBy?: string): Promise<Company> {
    const updateData: any = { 
      status: status as "pending" | "approved" | "rejected",
      updatedAt: new Date() 
    };
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
    }
    
    const [result] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    return result;
  }

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(filters: any = {}, limit = 50): Promise<any[]> {
    try {
      let whereClause = 'WHERE j.is_active = true';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters.jobType) {
        whereClause += ` AND j.job_type = $${paramIndex}`;
        params.push(filters.jobType);
        paramIndex++;
      }
      if (filters.experienceLevel) {
        whereClause += ` AND j.experience_level = $${paramIndex}`;
        params.push(filters.experienceLevel);
        paramIndex++;
      }
      if (filters.location) {
        whereClause += ` AND j.location ILIKE $${paramIndex}`;
        params.push(`%${filters.location}%`);
        paramIndex++;
      }
      if (filters.companyId !== undefined) {
        whereClause += ` AND j.company_id = $${paramIndex}`;
        params.push(filters.companyId);
        paramIndex++;
      }
      
      const query = `
        SELECT 
          j.id,
          j.company_id as "companyId",
          j.recruiter_id as "recruiterId",
          j.category_id as "categoryId",
          j.title,
          j.description,
          j.requirements,
          j.location,
          j.country,
          j.state,
          j.city,
          j.zip_code as "zipCode",
          j.job_type as "jobType",
          j.experience_level as "experienceLevel",
          j.salary,
          j.benefits,
          j.skills,
          j.is_active as "isActive",
          j.application_count as "applicationCount",
          j.created_at as "createdAt",
          j.updated_at as "updatedAt",
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'industry', c.industry,
            'logoUrl', c.logo_url
          ) as company
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT $${paramIndex}
      `;
      
      params.push(limit);
      
      // Use direct pool query to bypass Drizzle ORM issues
      const { Pool } = await import('@neondatabase/serverless');
      const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
      const directPool = new Pool({ connectionString: NEON_DATABASE_URL });
      const client = await directPool.connect();
      const result = await client.query(query, params);
      client.release();
      
      console.log(`getJobs query returned ${result.rows.length} jobs`);
      return result.rows;
    } catch (error) {
      console.error('Error in getJobs:', error);
      return [];
    }
  }

  async getJobsByCompany(companyId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.companyId, companyId), eq(jobs.isActive, true)))
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByRecruiter(recruiterId: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.recruiterId, recruiterId))
      .orderBy(desc(jobs.createdAt));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [result] = await db.insert(jobs).values(job).returning();
    return result;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job> {
    const [result] = await db
      .update(jobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async searchJobs(query: string, filters: any = {}): Promise<Job[]> {
    console.log("DEBUG searchJobs: query =", query, "filters =", filters);
    
    const conditions = [
      eq(jobs.isActive, true),
      or(
        ilike(jobs.title, `%${query}%`),
        ilike(jobs.description, `%${query}%`),
        ilike(jobs.city, `%${query}%`),
        ilike(jobs.state, `%${query}%`),
        ilike(jobs.country, `%${query}%`),
        ilike(jobs.zipCode, `%${query}%`)
      )
    ];

    if (filters.jobType) {
      conditions.push(eq(jobs.jobType, filters.jobType));
    }
    if (filters.experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
    }
    if (filters.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
    }
    if (filters.companyId !== undefined) {
      conditions.push(eq(jobs.companyId, filters.companyId));
    }

    return await db
      .select({
        id: jobs.id,
        companyId: jobs.companyId,
        recruiterId: jobs.recruiterId,
        title: jobs.title,
        description: jobs.description,
        requirements: jobs.requirements,
        location: jobs.location,
        country: jobs.country,
        state: jobs.state,
        city: jobs.city,
        zipCode: jobs.zipCode,
        jobType: jobs.jobType,
        experienceLevel: jobs.experienceLevel,
        salary: jobs.salary,
        benefits: jobs.benefits,
        skills: jobs.skills,
        isActive: jobs.isActive,
        applicationCount: jobs.applicationCount,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
          logoUrl: companies.logoUrl,
        }
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(50);
  }

  // Job Application operations
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return application;
  }

  async getUserJobApplications(userId: string): Promise<any[]> {
    try {
      console.log("getUserJobApplications called with userId:", userId);
      
      // First test basic query
      const testResult = await pool.query(`SELECT COUNT(*) FROM job_applications WHERE applicant_id = $1`, [userId]);
      console.log("Test count query result:", testResult.rows[0]);
      
      const result = await pool.query(`
        SELECT 
          ja.id,
          ja.job_id,
          ja.applicant_id, 
          ja.status,
          ja.applied_at,
          ja.cover_letter,
          ja.resume_url,
          j.id as job_id_from_jobs,
          j.title as job_title, 
          j.location as job_location,
          j.employment_type as job_employment_type,
          j.salary as job_salary,
          c.name as company_name,
          c.logo_url as company_logo_url
        FROM job_applications ja
        LEFT JOIN jobs j ON ja.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id  
        WHERE ja.applicant_id = $1
        ORDER BY ja.applied_at DESC
      `, [userId]);

      console.log("Query returned rows:", result.rows.length);
      if (result.rows.length > 0) {
        console.log("First row:", result.rows[0]);
      }

      return result.rows.map(row => ({
        id: row.id,
        jobId: row.job_id,
        applicantId: row.applicant_id,
        status: row.status,
        appliedAt: row.applied_at,
        coverLetter: row.cover_letter,
        resumeUrl: row.resume_url,
        job: {
          id: row.job_id_from_jobs,
          title: row.job_title,
          location: row.job_location,
          employmentType: row.job_employment_type,
          salary: row.job_salary,
          company: {
            name: row.company_name,
            logoUrl: row.company_logo_url,
          },
        },
      }));
    } catch (error) {
      console.error("Error in getUserJobApplications:", error);
      throw error;
    }
  }

  async getJobApplications(jobId: number): Promise<any[]> {
    return await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        rank: jobApplications.rank,
        appliedAt: jobApplications.appliedAt,
        applicant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          headline: users.headline,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(jobApplications)
      .leftJoin(users, eq(jobApplications.applicantId, users.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [result] = await db.insert(jobApplications).values(application).returning();
    
    // Increment application count
    await db
      .update(jobs)
      .set({ 
        applicationCount: sql`${jobs.applicationCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, application.jobId));
    
    return result;
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication> {
    const [result] = await db
      .update(jobApplications)
      .set({ 
        status: status as "pending" | "reviewed" | "interview" | "rejected" | "hired", 
        updatedAt: new Date() 
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return result;
  }

  async deleteJobApplication(id: number): Promise<void> {
    // Get the job ID first for updating application count
    const application = await this.getJobApplication(id);
    if (application) {
      await db.delete(jobApplications).where(eq(jobApplications.id, id));
      
      // Decrement application count
      await db
        .update(jobs)
        .set({ 
          applicationCount: sql`GREATEST(${jobs.applicationCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, application.jobId));
    }
  }

  // Connection operations
  async getUserConnections(userId: string): Promise<any[]> {
    return await db
      .select({
        id: connections.id,
        status: connections.status,
        createdAt: connections.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          headline: users.headline,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(connections)
      .leftJoin(users, or(
        eq(connections.requesterId, users.id),
        eq(connections.receiverId, users.id)
      ))
      .where(
        and(
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          ),
          eq(connections.status, "accepted")
        )
      )
      .orderBy(desc(connections.createdAt));
  }

  async getConnectionRequests(userId: string): Promise<any[]> {
    return await db
      .select({
        id: connections.id,
        status: connections.status,
        createdAt: connections.createdAt,
        requester: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          headline: users.headline,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(connections)
      .leftJoin(users, eq(connections.requesterId, users.id))
      .where(
        and(
          eq(connections.receiverId, userId),
          eq(connections.status, "pending")
        )
      )
      .orderBy(desc(connections.createdAt));
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [result] = await db.insert(connections).values(connection).returning();
    return result;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection> {
    const [result] = await db
      .update(connections)
      .set({ 
        status: status as "pending" | "accepted" | "declined", 
        updatedAt: new Date() 
      })
      .where(eq(connections.id, id))
      .returning();
    return result;
  }

  // Message operations
  async getUserMessages(userId: string, otherUserId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<any[]> {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        otherUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(messages)
      .leftJoin(users, or(
        eq(messages.senderId, users.id),
        eq(messages.receiverId, users.id)
      ))
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [result] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return result;
  }

  // Group operations
  async getGroups(limit = 20): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .orderBy(desc(groups.memberCount))
      .limit(limit);
  }

  async getUserGroups(userId: string): Promise<any[]> {
    return await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        memberCount: groups.memberCount,
        role: groupMemberships.role,
        joinedAt: groupMemberships.joinedAt,
      })
      .from(groupMemberships)
      .leftJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(eq(groupMemberships.userId, userId))
      .orderBy(desc(groupMemberships.joinedAt));
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [result] = await db.insert(groups).values(group).returning();
    
    // Add creator as admin member
    await db.insert(groupMemberships).values({
      groupId: result.id,
      userId: group.createdBy,
      role: "admin",
    });
    
    return result;
  }

  async joinGroup(groupId: number, userId: string): Promise<void> {
    await db.insert(groupMemberships).values({
      groupId,
      userId,
      role: "member",
    });
    
    // Increment member count
    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1` })
      .where(eq(groups.id, groupId));
  }

  // Vendor operations
  async getClientVendors(companyId: number): Promise<any[]> {
    try {
      console.log(`DEBUG: getClientVendors called with companyId=${companyId}, type: ${typeof companyId}`);
      
      // Test database connection and check total vendor count
      const totalVendorsResult = await pool.query('SELECT COUNT(*) as total FROM vendors');
      console.log(`DEBUG: Total vendors in database:`, totalVendorsResult.rows[0]);
      
      // Check all vendors to verify data
      const allVendorsCheck = await pool.query('SELECT id, company_id, name, status FROM vendors');
      console.log(`DEBUG: All vendors in database:`, allVendorsCheck.rows);
      
      // First check if any vendors exist for this company
      const allVendorsResult = await pool.query('SELECT * FROM vendors WHERE company_id = $1', [companyId]);
      console.log(`DEBUG: All vendors for company ${companyId}:`, allVendorsResult.rows);
      
      // Now check approved vendors
      const queryText = 'SELECT * FROM vendors WHERE company_id = $1 AND status = $2 ORDER BY created_at DESC';
      const queryValues = [companyId, 'approved'];
      
      console.log(`DEBUG: Executing query: ${queryText} with values:`, queryValues);
      
      const result = await pool.query(queryText, queryValues);
      
      console.log(`DEBUG: Found ${result.rows.length} approved vendors for company ${companyId}:`, result.rows);
      return result.rows;
    } catch (error) {
      console.error("Error in getClientVendors:", error);
      return [];
    }
  }

  async addVendor(vendor: InsertVendor): Promise<Vendor> {
    try {
      console.log(`DEBUG: Adding vendor with raw SQL:`, vendor);
      
      // Use raw SQL to avoid Drizzle schema mapping issues
      const result = await pool.query(`
        INSERT INTO vendors (company_id, name, email, phone, services, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        vendor.companyId,
        vendor.name,
        vendor.email,
        vendor.phone || null,
        vendor.services,
        "pending" // All new vendors require admin approval
      ]);
      
      console.log(`DEBUG: Added vendor successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in addVendor:", error);
      throw error;
    }
  }

  async updateVendorStatus(id: number, status: string, approvedBy?: string): Promise<Vendor> {
    try {
      console.log(`DEBUG: Updating vendor ${id} status to ${status} by ${approvedBy}`);
      
      // Use raw SQL to avoid Drizzle schema mapping issues
      const result = await pool.query(`
        UPDATE vendors 
        SET status = $1, approved_by = $2
        WHERE id = $3
        RETURNING *
      `, [status, approvedBy || null, id]);
      
      if (result.rows.length === 0) {
        throw new Error(`Vendor with id ${id} not found`);
      }
      
      console.log(`DEBUG: Updated vendor successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating vendor status:", error);
      throw error;
    }
  }

  async getPendingVendors(): Promise<any[]> {
    return await db
      .select()
      .from(vendors)
      .where(eq(vendors.status, "pending"))
      .orderBy(desc(vendors.createdAt));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  // Location operations
  async getCountries(): Promise<Country[]> {
    return await db.select({
      id: countries.id,
      name: countries.name,
      code: countries.code
    }).from(countries).orderBy(countries.name);
  }

  async getStatesByCountry(countryId: number): Promise<State[]> {
    return await db.select().from(states).where(eq(states.countryId, countryId)).orderBy(states.name);
  }

  async getCitiesByState(stateId: number): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.stateId, stateId)).orderBy(cities.name);
  }
}

export const storage = new DatabaseStorage();

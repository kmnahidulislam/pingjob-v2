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
  externalInvitations,
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
  type ExternalInvitation,
  type InsertExternalInvitation,
} from "@shared/schema";
import { cleanPool as pool, cleanDb as db, initializeCleanDatabase } from './clean-neon';
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getTotalUserCount(): Promise<number>;
  
  // Password reset operations
  updateUserResetToken(userId: string, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  clearUserResetToken(userId: string): Promise<void>;
  
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
  bulkCreateCompanies(companies: InsertCompany[]): Promise<void>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  getCompanies(limit?: number): Promise<Company[]>;
  getTopCompanies(): Promise<Company[]>;
  searchCompanies(query: string, limit?: number): Promise<Company[]>;
  getPendingCompanies(): Promise<Company[]>;
  updateCompanyStatus(id: number, status: string, approvedBy?: string): Promise<Company>;
  clearAllCompanies(): Promise<void>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobs(filters?: any, limit?: number): Promise<Job[]>;
  getJobsByCompany(companyId: number): Promise<Job[]>;
  getJobsByRecruiter(recruiterId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  searchJobs(query: string, filters?: any): Promise<Job[]>;
  searchJobsForHomePage(query: string, limit?: number): Promise<any[]>;
  
  // Job Application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getUserJobApplications(userId: string): Promise<any[]>;
  getJobApplications(jobId: number): Promise<any[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication>;
  updateJobApplicationScoring(id: number, scoringData: any): Promise<JobApplication>;
  getJobApplicationsWithScores(jobId: number): Promise<any[]>;
  getApplicationsAboveThreshold(threshold?: number): Promise<any[]>;
  
  // Connection operations
  getUserConnections(userId: string): Promise<any[]>;
  getConnectionRequests(userId: string): Promise<any[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection>;
  getUsersByCategory(categoryId: number, excludeUserId?: string): Promise<any[]>;
  getCategoriesWithUserCounts(): Promise<any[]>;
  
  // Message operations
  getUserMessages(userId: string, otherUserId: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Group operations
  getGroups(limit?: number): Promise<Group[]>;
  getUserGroups(userId: string): Promise<any[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  
  // Vendor operations
  getClientVendors(clientId: number): Promise<any[]>;
  addVendor(vendor: InsertVendor): Promise<Vendor>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor>;
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

  // External invitation operations
  createExternalInvitation(invitation: InsertExternalInvitation): Promise<ExternalInvitation>;
  getExternalInvitation(token: string): Promise<ExternalInvitation | undefined>;
  getExternalInvitationsByInviter(inviterUserId: string): Promise<ExternalInvitation[]>;
  updateExternalInvitationStatus(id: number, status: string, acceptedAt?: Date): Promise<ExternalInvitation>;
  resetPassword(token: string, hashedPassword: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    // Use raw SQL to bypass schema caching issues
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Use raw SQL to bypass schema caching issues
    console.log("Searching for user with email:", email);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log("Query result rows:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("Found user:", { id: result.rows[0].id, email: result.rows[0].email });
    }
    return result.rows[0] as User | undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    // Generate a unique ID for new users
    const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use raw SQL to bypass schema issues
    const result = await pool.query(`
      INSERT INTO users (id, email, password, first_name, last_name, user_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, password, first_name, last_name, user_type, profile_image_url, category_id, headline, summary, location, industry, created_at, updated_at
    `, [userId, userData.email, userData.password, userData.firstName, userData.lastName, userData.userType || 'job_seeker']);
    
    return result.rows[0] as User;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to insert the user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error: any) {
      // If there's a conflict, update the existing user
      if (error.code === '23505') { // unique constraint violation
        const [user] = await db
          .update(users)
          .set({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            userType: userData.userType,
            updatedAt: new Date(),
          })
          .where(or(eq(users.id, userData.id), eq(users.email, userData.email!)))
          .returning();
        return user;
      }
      throw error;
    }
  }

  async getTotalUserCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }

  async getTotalCompanyCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM companies');
    return parseInt(result.rows[0].count);
  }

  async getTotalActiveJobsCount(): Promise<number> {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE status IS NULL OR status != 'closed'
    `);
    return parseInt(result.rows[0].count);
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

  // Password reset methods
  async initializePasswordResetColumns(): Promise<void> {
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`);
      console.log('Password reset columns initialized successfully');
    } catch (error: any) {
      console.log('Password reset columns setup:', error.message);
      throw error;
    }
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    try {
      // First, ensure the columns exist
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`);
        console.log("Password reset columns ensured");
      } catch (alterError: any) {
        // Columns may already exist, that's fine
        if (!alterError.message.includes('already exists')) {
          console.log("Column creation note:", alterError.message);
        }
      }

      const result = await pool.query(`
        UPDATE users 
        SET reset_token = $1, reset_token_expiry = $2
        WHERE email = $3
        RETURNING id
      `, [token, expiry, email]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error setting password reset token:", error);
      return false;
    }
  }

  async getUserByResetToken(token: string): Promise<User | null> {
    try {
      const result = await pool.query(`
        SELECT * FROM users 
        WHERE reset_token = $1 AND reset_token_expiry > NOW()
      `, [token]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return null;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const result = await pool.query(`
        UPDATE users 
        SET password = $1, reset_token = NULL, reset_token_expiry = NULL
        WHERE reset_token = $2 AND reset_token_expiry > NOW()
        RETURNING id
      `, [newPassword, token]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
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

  async bulkCreateCompanies(companyList: InsertCompany[]): Promise<void> {
    if (companyList.length === 0) return;
    
    // Use batch inserts for maximum speed - split into chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < companyList.length; i += chunkSize) {
      const chunk = companyList.slice(i, i + chunkSize);
      await db.insert(companies).values(chunk);
    }
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [result] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return result;
  }

  async getCompanies(limit = 50000): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.*,
          COALESCE(v.vendor_count, 0)::integer as vendor_count
        FROM companies c
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as vendor_count 
          FROM vendors 
          GROUP BY company_id
        ) v ON c.id = v.company_id
        WHERE c.status = 'approved'
        ORDER BY c.followers DESC
        ${limit === 50000 ? '' : `LIMIT ${limit}`}
      `;
      
      const result = await pool.query(query);
      console.log(`DEBUG ROUTE: getCompanies returned ${result.rows.length} companies with vendor counts`);
      
      // Convert vendor_count from string to number and transform snake_case to camelCase
      const processedRows = result.rows.map(row => {
        const vendorCount = parseInt(row.vendor_count) || 0;
        console.log(`DEBUG: Converting vendor_count "${row.vendor_count}" to ${vendorCount} for company ${row.name}`);
        return {
          ...row,
          vendor_count: vendorCount,
          logoUrl: row.logo_url, // Transform snake_case to camelCase for frontend compatibility
          zipCode: row.zip_code,
          userId: row.user_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          approvedBy: row.approved_by
        };
      });
      
      return processedRows;
    } catch (error) {
      console.error('Error in getCompanies with vendor counts:', error);
      // Fallback to original query without vendor counts
      if (limit === 50000) {
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
  }

  // Get top 100 companies prioritized by vendor and job count
  async getTopCompanies(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.country,
          c.state,
          c.city,
          c.location,
          c.zip_code,
          c.website,
          c.phone,
          c.status,
          c.approved_by,
          c.user_id,
          c.logo_url,
          c.created_at,
          c.updated_at,
          c.followers,
          COALESCE(v.vendor_count, 0)::integer as vendor_count,
          COALESCE(j.job_count, 0)::integer as job_count,
          (COALESCE(v.vendor_count, 0) + COALESCE(j.job_count, 0))::integer as total_activity
        FROM companies c
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as vendor_count 
          FROM vendors 
          GROUP BY company_id
        ) v ON c.id = v.company_id
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as job_count 
          FROM jobs 
          GROUP BY company_id
        ) j ON c.id = j.company_id
        WHERE c.status = 'approved'
        ORDER BY job_count DESC, vendor_count DESC, c.followers DESC, c.created_at DESC
        LIMIT 100
      `;
      
      console.log(`DEBUG: Executing getTopCompanies query...`);
      const result = await pool.query(query);
      console.log(`DEBUG: Query returned ${result.rows.length} rows`);
      console.log(`DEBUG: First 3 results:`, result.rows.slice(0, 3).map(r => 
        `ID:${r.id} ${r.name} - Vendors:${r.vendor_count} Jobs:${r.job_count}`));
      
      if (result.rows[0]?.vendor_count === 0) {
        console.log(`WARNING: Top company has 0 vendors - this indicates a problem with the query`);
      }
      
      return result.rows.map(row => ({
        ...row,
        vendor_count: parseInt(row.vendor_count) || 0,
        job_count: parseInt(row.job_count) || 0,
        total_activity: parseInt(row.total_activity) || 0,
        // Add camelCase versions for frontend compatibility
        vendorCount: parseInt(row.vendor_count) || 0,
        jobCount: parseInt(row.job_count) || 0,
        logoUrl: row.logo_url,
        zipCode: row.zip_code,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedBy: row.approved_by
      }));
    } catch (error) {
      console.error('Error fetching top companies:', error);
      throw error;
    }
  }

  async searchCompanies(query: string, limit = 50000): Promise<any[]> {
    console.log(`DEBUG: searchCompanies called with query="${query}", limit=${limit}`);
    
    try {
      const searchQuery = `
        SELECT DISTINCT
          c.*,
          COALESCE(v.vendor_count, 0)::integer as vendor_count
        FROM companies c
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as vendor_count 
          FROM vendors 
          GROUP BY company_id
        ) v ON c.id = v.company_id
        WHERE c.status = 'approved' 
          AND (
            LOWER(c.name) LIKE LOWER($1) OR
            LOWER(c.city) LIKE LOWER($1) OR
            LOWER(c.state) LIKE LOWER($1) OR
            c.zip_code = $2 OR
            LOWER(c.zip_code) LIKE LOWER($1) OR
            LOWER(c.industry) LIKE LOWER($1) OR
            LOWER(c.description) LIKE LOWER($1) OR
            LOWER(c.location) LIKE LOWER($1)
          )
        ORDER BY c.followers DESC
        ${limit === 50000 ? '' : `LIMIT ${limit}`}
      `;
      
      const searchTerm = `%${query}%`;
      const exactTerm = query.trim();
      const result = await pool.query(searchQuery, [searchTerm, exactTerm]);
      console.log(`DEBUG: searchCompanies returned ${result.rows.length} results for "${query}"`);
      
      // Convert vendor_count from string to number and transform snake_case to camelCase
      const processedRows = result.rows.map(row => ({
        ...row,
        vendor_count: parseInt(row.vendor_count) || 0,
        logoUrl: row.logo_url, // Transform snake_case to camelCase for frontend compatibility
        zipCode: row.zip_code,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedBy: row.approved_by
      }));
      
      return processedRows;
    } catch (error) {
      console.error('Error in searchCompanies with vendor counts:', error);
      // Fallback to original Drizzle query without vendor counts
      const searchCondition = or(
        sql`LOWER(${companies.name}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.city}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.state}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.zipCode}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.industry}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.description}) LIKE LOWER(${'%' + query + '%'})`,
        sql`LOWER(${companies.location}) LIKE LOWER(${'%' + query + '%'})`
      );
      
      let results: any[];
      if (limit === 50000) {
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
      
      console.log(`DEBUG: searchCompanies fallback returned ${results.length} results for "${query}"`);
      return results;
    }
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

  async updateCompanyAddress(id: number, addressData: { city?: string; state?: string; zipCode?: string; country?: string }): Promise<Company> {
    // Map zipCode to the correct database field
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (addressData.city) updateData.city = addressData.city;
    if (addressData.state) updateData.state = addressData.state;
    if (addressData.zipCode) updateData.zipCode = addressData.zipCode;
    if (addressData.country) updateData.country = addressData.country;
    
    const [result] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    return result;
  }

  async clearAllCompanies(): Promise<void> {
    // Use raw SQL to handle cascade deletions properly
    await pool.query('TRUNCATE TABLE job_applications CASCADE');
    await pool.query('TRUNCATE TABLE vendors CASCADE');
    await pool.query('TRUNCATE TABLE jobs CASCADE');
    await pool.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');
  }

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    try {
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
            'logoUrl', c.logo_url,
            'description', c.description
          ) as company
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE j.id = $1
      `;
      
      const { Pool } = await import('pg');
      const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
      const directPool = new Pool({ 
        connectionString: NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await directPool.connect();
      const result = await client.query(query, [id]);
      client.release();
      
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error in getJob:', error);
      return undefined;
    }
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
          COALESCE(v.vendor_count, 0) as "vendorCount",
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'industry', c.industry,
            'logoUrl', c.logo_url
          ) as company
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as vendor_count 
          FROM vendors 
          WHERE status = 'approved'
          GROUP BY company_id
        ) v ON c.id = v.company_id
        ${whereClause}
        ORDER BY j.updated_at DESC, j.created_at DESC
        LIMIT $${paramIndex}
      `;
      
      params.push(limit);
      
      // Use direct pool query to bypass Drizzle ORM issues
      const { Pool } = await import('pg');
      const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
      const directPool = new Pool({ 
        connectionString: NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await directPool.connect();
      const result = await client.query(query, params);
      client.release();
      
      console.log(`getJobs query returned ${result.rows.length} jobs`);
      
      // Vendor count data successfully integrated
      
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

  async searchJobs(query: string, filters: any = {}): Promise<any[]> {
    console.log("DEBUG searchJobs: query =", query, "filters =", filters);
    
    try {
      let whereClause = 'WHERE j.is_active = true';
      const params: any[] = [`%${query}%`];
      let paramIndex = 2;
      
      // Add keyword search conditions including zip code with exact and partial matching
      whereClause += ` AND (
        j.title ILIKE $1 OR 
        j.description ILIKE $1 OR 
        j.requirements ILIKE $1 OR
        j.skills ILIKE $1 OR
        j.city ILIKE $1 OR 
        j.state ILIKE $1 OR 
        j.country ILIKE $1 OR
        j.location ILIKE $1 OR
        j.zip_code = $2 OR
        j.zip_code ILIKE $1 OR
        c.name ILIKE $1 OR
        c.city ILIKE $1 OR
        c.state ILIKE $1 OR
        c.zip_code = $2 OR
        c.zip_code ILIKE $1
      )`;
      
      // Add exact zip code match parameter
      params.push(query.trim());
      paramIndex++;
      
      // Add additional filters
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
      
      const searchQuery = `
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
          COALESCE(v.vendor_count, 0) as "vendorCount",
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'industry', c.industry,
            'logoUrl', c.logo_url
          ) as company
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN (
          SELECT company_id, COUNT(*)::integer as vendor_count 
          FROM vendors 
          WHERE status = 'approved'
          GROUP BY company_id
        ) v ON c.id = v.company_id
        ${whereClause}
        ORDER BY j.updated_at DESC, j.created_at DESC
        LIMIT 50
      `;
      
      // Use direct pool query for consistent results
      const { Pool } = await import('pg');
      const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
      const directPool = new Pool({ 
        connectionString: NEON_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await directPool.connect();
      const result = await client.query(searchQuery, params);
      client.release();
      
      console.log(`Search returned ${result.rows.length} jobs`);
      return result.rows;
    } catch (error) {
      console.error('Error in searchJobs:', error);
      return [];
    }
  }

  async searchJobsForHomePage(query: string, limit: number = 5): Promise<any[]> {
    try {
      console.log(`Home page search for jobs: "${query}" (limit: ${limit})`);
      
      // Use raw SQL for better performance and control
      const searchQuery = `
        SELECT 
          j.id,
          j.title,
          j.location,
          j.city,
          j.state,
          j.country,
          j.created_at as "createdAt",
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'logoUrl', c.logo_url
          ) as company
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE j.is_active = true
          AND (
            j.title ILIKE $1 OR 
            j.description ILIKE $1 OR
            j.location ILIKE $1 OR
            j.city ILIKE $1 OR
            j.state ILIKE $1 OR
            c.name ILIKE $1
          )
        ORDER BY j.created_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(searchQuery, [`%${query}%`, limit]);
      console.log(`Found ${result.rows.length} jobs for home page search`);
      
      return result.rows;
    } catch (error) {
      console.error('Error in searchJobsForHomePage:', error);
      return [];
    }
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
      
      // Debug: Check what's actually in the job_applications table
      const allApps = await pool.query(`SELECT id, applicant_id, job_id, status, applied_at FROM job_applications LIMIT 10`);
      console.log("All job applications in database:", allApps.rows);
      
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
        // rank: jobApplications.rank, // Temporarily removed due to schema mismatch
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
    console.log('Creating job application with data:', application);
    
    const [result] = await db.insert(jobApplications).values(application).returning();
    console.log('Job application created successfully:', result);
    
    // Increment application count
    await db
      .update(jobs)
      .set({ 
        applicationCount: sql`${jobs.applicationCount} + 1`
        // updatedAt: new Date() // Removed - column doesn't exist in current DB schema
      })
      .where(eq(jobs.id, application.jobId));
    
    return result;
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication> {
    const [result] = await db
      .update(jobApplications)
      .set({ 
        status: status as "pending" | "reviewed" | "interview" | "rejected" | "hired"
        // updatedAt: new Date() // Removed - column doesn't exist in current DB schema
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return result;
  }

  async updateJobApplicationScoring(id: number, scoringData: any): Promise<JobApplication> {
    const [application] = await db
      .update(jobApplications)
      .set({
        parsedSkills: scoringData.parsedSkills,
        parsedExperience: scoringData.parsedExperience,
        parsedEducation: scoringData.parsedEducation,
        parsedCompanies: scoringData.parsedCompanies,
        matchScore: scoringData.matchScore,
        skillsScore: scoringData.skillsScore,
        experienceScore: scoringData.experienceScore,
        educationScore: scoringData.educationScore,
        isProcessed: true,
        processingError: scoringData.processingError || null,
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return application;
  }

  async getJobApplicationsWithScores(jobId: number): Promise<any[]> {
    const result = await db
      .select({
        id: jobApplications.id,
        applicantId: jobApplications.applicantId,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        matchScore: jobApplications.matchScore,
        skillsScore: jobApplications.skillsScore,
        experienceScore: jobApplications.experienceScore,
        educationScore: jobApplications.educationScore,
        parsedSkills: jobApplications.parsedSkills,
        isProcessed: jobApplications.isProcessed,
        applicant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          headline: users.headline,
        }
      })
      .from(jobApplications)
      .leftJoin(users, eq(jobApplications.applicantId, users.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.matchScore));

    return result;
  }

  async getApplicationsAboveThreshold(threshold: number = 5): Promise<any[]> {
    const result = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        applicantId: jobApplications.applicantId,
        matchScore: jobApplications.matchScore,
        skillsScore: jobApplications.skillsScore,
        experienceScore: jobApplications.experienceScore,
        educationScore: jobApplications.educationScore,
        appliedAt: jobApplications.appliedAt,
        job: {
          id: jobs.id,
          title: jobs.title,
          company: {
            name: companies.name,
            logoUrl: companies.logoUrl,
          }
        },
        applicant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(jobApplications)
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(users, eq(jobApplications.applicantId, users.id))
      .where(and(
        eq(jobApplications.isProcessed, true),
        sql`${jobApplications.matchScore} >= ${threshold}`
      ))
      .orderBy(desc(jobApplications.matchScore));

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
        eq(connections.senderId, users.id),
        eq(connections.receiverId, users.id)
      ))
      .where(
        and(
          or(
            eq(connections.senderId, userId),
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
      .leftJoin(users, eq(connections.senderId, users.id))
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

  async getUsersByCategory(categoryId: number, excludeUserId?: string): Promise<any[]> {
    let whereCondition = eq(users.categoryId, categoryId);
    
    if (excludeUserId) {
      whereCondition = and(eq(users.categoryId, categoryId), sql`${users.id} != ${excludeUserId}`);
    }

    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        headline: users.headline,
        summary: users.summary,
        location: users.location,
        industry: users.industry,
        profileImageUrl: users.profileImageUrl,
        categoryId: users.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
        },
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(categories, eq(users.categoryId, categories.id))
      .where(whereCondition)
      .orderBy(desc(users.createdAt));
  }

  async getCategoriesWithUserCounts(): Promise<any[]> {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        userCount: sql<number>`COUNT(${users.id})::int`,
      })
      .from(categories)
      .leftJoin(users, eq(categories.id, users.categoryId))
      .groupBy(categories.id, categories.name, categories.description)
      .having(sql`COUNT(${users.id}) > 0`)
      .orderBy(sql`COUNT(${users.id}) DESC`);
  }

  // Message operations
  async getUserMessages(userId: string, otherUserId: string): Promise<Message[]> {
    // Use raw SQL to match actual database schema (sent_at instead of created_at)
    const query = `
      SELECT 
        id,
        sender_id as "senderId",
        receiver_id as "receiverId", 
        content,
        read_at IS NOT NULL as "isRead",
        sent_at as "createdAt"
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY sent_at ASC
    `;
    
    const result = await pool.query(query, [userId, otherUserId]);
    return result.rows;
  }

  async getConversations(userId: string): Promise<any[]> {
    // Use raw SQL to match actual database schema (sent_at, read_at instead of created_at, is_read)
    const query = `
      SELECT 
        m.id,
        m.content,
        m.read_at IS NOT NULL as "isRead",
        m.sent_at as "createdAt",
        jsonb_build_object(
          'id', u.id,
          'firstName', u.first_name,
          'lastName', u.last_name,
          'profileImageUrl', u.profile_image_url
        ) as "otherUser"
      FROM messages m
      LEFT JOIN users u ON (
        CASE 
          WHEN m.sender_id = $1 THEN u.id = m.receiver_id
          ELSE u.id = m.sender_id
        END
      )
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY m.sent_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    // Use raw SQL to match actual database schema (sent_at instead of created_at)
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, sent_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, sender_id as "senderId", receiver_id as "receiverId", content, 
                read_at IS NOT NULL as "isRead", sent_at as "createdAt"
    `;
    
    const result = await pool.query(query, [message.senderId, message.receiverId, message.content]);
    return result.rows[0];
  }

  async markMessageAsRead(id: number): Promise<Message> {
    // Use raw SQL to match actual database schema (read_at timestamp instead of is_read boolean)
    const query = `
      UPDATE messages 
      SET read_at = NOW() 
      WHERE id = $1 
      RETURNING id, sender_id as "senderId", receiver_id as "receiverId", content, 
                read_at IS NOT NULL as "isRead", sent_at as "createdAt"
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    // Use raw SQL to match actual database schema (read_at column instead of is_read)
    const query = `
      SELECT COUNT(*)::int as count
      FROM messages 
      WHERE receiver_id = $1 AND read_at IS NULL
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.count || 0;
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

  // Get vendors for specific company and show the vendor's actual company location (not client location)
  async getClientVendors(companyId: number): Promise<any[]> {
    try {
      console.log(`DEBUG: Getting vendors for company ${companyId} with their actual vendor company locations`);
      
      // Get vendors for specific company and find their actual company details by matching vendor name to company name
      const queryText = `
        SELECT DISTINCT
          v.id as vendor_id,
          v.name as vendor_name,
          v.email,
          v.phone,
          v.services,
          v.status,
          v.created_at,
          v.approved_by,
          v.company_id as client_company_id,
          vendor_co.id as vendor_company_id,
          vendor_co.name as vendor_company_name,
          vendor_co.city,
          vendor_co.state,
          vendor_co.zip_code,
          vendor_co.country,
          vendor_co.location,
          vendor_co.website
        FROM vendors v
        LEFT JOIN companies vendor_co ON LOWER(vendor_co.name) = LOWER(v.name)
        WHERE v.company_id = $1
        ORDER BY v.created_at DESC
      `;
      
      console.log(`DEBUG: Executing vendor query for company ${companyId}: ${queryText}`);
      
      const result = await pool.query(queryText, [companyId]);
      
      // Map service codes to proper names
      const serviceMap: { [key: string]: string } = {
        'ste': 'Strategic Consulting',
        'staff': 'Staff Augmentation',
        'staffing': 'Staffing Services',
        'Staffing': 'Staffing Services',
        'it': 'IT Services',
        'consulting': 'Business Consulting',
        'development': 'Software Development',
        'design': 'Design Services',
        'marketing': 'Marketing Services',
        'finance': 'Financial Services',
        'hr': 'Human Resources',
        'legal': 'Legal Services',
        'support': 'Technical Support'
      };
      
      // Transform results to include proper service names
      const transformedResults = result.rows.map(vendor => ({
        ...vendor,
        service_name: serviceMap[vendor.services] || vendor.services || 'General Services'
      }));
      
      console.log(`DEBUG: Found ${transformedResults.length} total vendors with vendor company locations:`, transformedResults);
      return transformedResults;
    } catch (error) {
      console.error("Error in getClientVendors:", error);
      return [];
    }
  }

  async addVendor(vendor: InsertVendor): Promise<Vendor> {
    try {
      console.log(`DEBUG: Adding vendor with raw SQL:`, vendor);
      
      // First, get the next available ID to avoid sequence conflicts
      const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM vendors');
      const nextId = maxIdResult.rows[0].next_id;
      
      // Use raw SQL with explicit ID to avoid sequence issues
      const result = await pool.query(`
        INSERT INTO vendors (id, company_id, name, email, phone, services, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        nextId,
        vendor.companyId,
        vendor.name,
        vendor.email,
        vendor.phone || null,
        vendor.services,
        vendor.status || "pending" // All new vendors require admin approval
      ]);
      
      // Update the sequence to prevent future conflicts
      await pool.query(`SELECT setval('vendors_id_seq', ${nextId}, true)`);
      
      console.log(`DEBUG: Added vendor successfully with ID ${nextId}:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in addVendor:", error);
      throw error;
    }
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    try {
      console.log(`DEBUG: Creating vendor for company ${vendor.companyId}:`, vendor);
      
      // Use raw SQL to avoid Drizzle schema mapping issues
      const result = await pool.query(`
        INSERT INTO vendors (company_id, name, email, phone, services, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        vendor.companyId,
        vendor.name,
        vendor.email,
        vendor.phone || null,
        vendor.services,
        vendor.status || "pending",
        vendor.createdBy || null
      ]);
      
      console.log(`DEBUG: Created vendor successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in createVendor:", error);
      throw error;
    }
  }

  async updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor> {
    try {
      console.log(`DEBUG: Updating vendor ${id} with data:`, vendor);
      
      // Build dynamic SQL query based on provided fields
      const setFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (vendor.companyId !== undefined) {
        setFields.push(`company_id = $${paramIndex}`);
        values.push(vendor.companyId);
        paramIndex++;
      }
      if (vendor.name !== undefined) {
        setFields.push(`name = $${paramIndex}`);
        values.push(vendor.name);
        paramIndex++;
      }
      if (vendor.email !== undefined) {
        setFields.push(`email = $${paramIndex}`);
        values.push(vendor.email);
        paramIndex++;
      }
      if (vendor.phone !== undefined) {
        setFields.push(`phone = $${paramIndex}`);
        values.push(vendor.phone);
        paramIndex++;
      }
      if (vendor.services !== undefined) {
        setFields.push(`services = $${paramIndex}`);
        values.push(vendor.services);
        paramIndex++;
      }
      if (vendor.status !== undefined) {
        setFields.push(`status = $${paramIndex}`);
        values.push(vendor.status);
        paramIndex++;
      }
      
      values.push(id); // Add ID as the last parameter
      
      const result = await pool.query(`
        UPDATE vendors 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Vendor with id ${id} not found`);
      }
      
      console.log(`DEBUG: Updated vendor successfully:`, result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating vendor:", error);
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
    try {
      // Use raw SQL to avoid schema mapping issues
      const result = await pool.query(`
        SELECT 
          v.id,
          v.name,
          v.email,
          v.phone,
          v.services,
          v.status,
          v.created_at as "createdAt",
          json_build_object(
            'id', c.id,
            'name', c.name,
            'industry', c.industry
          ) as company
        FROM vendors v
        LEFT JOIN companies c ON v.company_id = c.id
        WHERE v.status = 'pending'
        ORDER BY v.created_at DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
      throw error;
    }
  }

  async approveAllVendors(): Promise<{ updated: number }> {
    try {
      console.log('DEBUG: Approving all vendors in database...');
      
      const result = await pool.query(`
        UPDATE vendors 
        SET status = 'approved', approved_by = 'system'
        WHERE status != 'approved'
        RETURNING id
      `);
      
      console.log(`DEBUG: Successfully approved ${result.rows.length} vendors`);
      return { updated: result.rows.length };
    } catch (error) {
      console.error("Error in approveAllVendors:", error);
      throw error;
    }
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

  // Categories with job counts
  async getCategoriesWithJobCounts(): Promise<(Category & { jobCount: number })[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        createdAt: categories.createdAt,
        jobCount: sql<number>`COUNT(${jobs.id})::int`
      })
      .from(categories)
      .leftJoin(jobs, eq(categories.id, jobs.categoryId))
      .groupBy(categories.id, categories.name, categories.description, categories.createdAt)
      .orderBy(desc(sql`COUNT(${jobs.id})`));
    
    return result;
  }

  // Get top companies by category with job and vendor counts
  async getTopCompaniesByCategory(categoryId: number, limit: number = 10): Promise<Array<{
    id: number;
    name: string;
    logoUrl: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    website: string | null;
    jobCount: number;
    vendorCount: number;
  }>> {
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        logoUrl: companies.logoUrl,
        location: companies.location,
        city: companies.city,
        state: companies.state,
        zipCode: companies.zipCode,
        country: companies.country,
        website: companies.website,
        jobCount: sql<number>`COUNT(DISTINCT ${jobs.id})::int`,
        vendorCount: sql<number>`COUNT(DISTINCT ${vendors.id})::int`
      })
      .from(companies)
      .leftJoin(jobs, and(eq(companies.id, jobs.companyId), eq(jobs.categoryId, categoryId)))
      .leftJoin(vendors, eq(companies.id, vendors.companyId))
      .groupBy(companies.id, companies.name, companies.logoUrl, companies.location, 
               companies.city, companies.state, companies.zipCode, companies.country, companies.website)
      .having(sql`COUNT(DISTINCT ${jobs.id}) > 0`)
      .orderBy(desc(sql`COUNT(DISTINCT ${jobs.id})`), desc(sql`COUNT(DISTINCT ${vendors.id})`))
      .limit(limit);

    return result;
  }

  // Get latest jobs for a specific category (for unregistered users)
  async getLatestJobsByCategory(categoryId: number, limit: number = 10): Promise<Job[]> {
    const result = await db
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
        salary: jobs.salary,
        employmentType: jobs.employmentType,
        experienceLevel: jobs.experienceLevel,
        categoryId: jobs.categoryId,
        jobType: jobs.jobType,
        benefits: jobs.benefits,
        skills: jobs.skills,
        isActive: jobs.isActive,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        applicationCount: jobs.applicationCount,
        company: {
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          location: companies.location,
          city: companies.city,
          state: companies.state,
          zipCode: companies.zipCode,
          country: companies.country
        }
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(eq(jobs.categoryId, categoryId), eq(jobs.isActive, true)))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);

    return result;
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

  async createExternalInvitation(invitation: any): Promise<ExternalInvitation> {
    const [created] = await db.insert(externalInvitations).values(invitation).returning();
    return created;
  }

  async getExternalInvitation(token: string): Promise<ExternalInvitation | undefined> {
    const [invitation] = await db.select().from(externalInvitations).where(eq(externalInvitations.inviteToken, token));
    return invitation;
  }

  async getExternalInvitationsByInviter(inviterUserId: string): Promise<ExternalInvitation[]> {
    return await db.select().from(externalInvitations).where(eq(externalInvitations.inviterUserId, inviterUserId)).orderBy(desc(externalInvitations.createdAt));
  }

  async updateExternalInvitationStatus(id: number, status: string, acceptedAt?: Date): Promise<ExternalInvitation> {
    const updateData: any = { status };
    if (acceptedAt) {
      updateData.acceptedAt = acceptedAt;
    }
    const [updated] = await db.update(externalInvitations).set(updateData).where(eq(externalInvitations.id, id)).returning();
    return updated;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    trialEndsAt?: Date;
    subscriptionEndsAt?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeInfo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscriptionStatus(
    stripeCustomerId: string,
    status: string,
    periodEnd: number | null
  ): Promise<void> {
    const endDate = periodEnd ? new Date(periodEnd * 1000) : null;
    await db
      .update(users)
      .set({
        subscriptionStatus: status as any,
        subscriptionEndsAt: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.stripeCustomerId, stripeCustomerId));
  }

  // Password reset operations
  async updateUserResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        userType: users.userType,
        categoryId: users.categoryId,
        headline: users.headline,
        summary: users.summary,
        location: users.location,
        industry: users.industry,
        facebookUrl: users.facebookUrl,
        twitterUrl: users.twitterUrl,
        instagramUrl: users.instagramUrl,
        resetToken: users.resetToken,
        resetTokenExpiry: users.resetTokenExpiry,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.resetToken, token));
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async clearUserResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}

// Initialize database first
initializeCleanDatabase();

export const storage = new DatabaseStorage();
export { pool as pool };

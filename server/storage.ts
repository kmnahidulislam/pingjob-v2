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
} from "@shared/schema";
import { db } from "./db";
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
          ...userData,
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

  async getCompanies(limit = 20): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .orderBy(desc(companies.followers))
      .limit(limit);
  }

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(filters: any = {}, limit = 50): Promise<Job[]> {
    const conditions = [eq(jobs.isActive, true)];
    
    if (filters.jobType) {
      conditions.push(eq(jobs.jobType, filters.jobType));
    }
    if (filters.experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
    }
    if (filters.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
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
      .limit(limit);
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
    const conditions = [
      eq(jobs.isActive, true),
      or(
        ilike(jobs.title, `%${query}%`),
        ilike(jobs.description, `%${query}%`)
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
    return await db
      .select({
        id: jobApplications.id,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt,
        job: {
          id: jobs.id,
          title: jobs.title,
          company: companies.name,
          location: jobs.location,
        },
      })
      .from(jobApplications)
      .leftJoin(jobs, eq(jobApplications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobApplications.applicantId, userId))
      .orderBy(desc(jobApplications.appliedAt));
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
  async getClientVendors(clientId: number): Promise<any[]> {
    return await db
      .select({
        id: vendors.id,
        vendor: {
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
          location: companies.city,
        },
        status: vendors.status,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .leftJoin(companies, eq(vendors.vendorId, companies.id))
      .where(eq(vendors.clientId, clientId))
      .orderBy(desc(vendors.createdAt));
  }

  async addVendor(vendor: InsertVendor): Promise<Vendor> {
    const [result] = await db.insert(vendors).values(vendor).returning();
    return result;
  }

  async updateVendorStatus(id: number, status: string, approvedBy?: string): Promise<Vendor> {
    const [result] = await db
      .update(vendors)
      .set({ 
        status: status as "pending" | "approved" | "rejected",
        approvedBy,
        updatedAt: new Date() 
      })
      .where(eq(vendors.id, id))
      .returning();
    return result;
  }

  async getPendingVendors(): Promise<any[]> {
    return await db
      .select({
        id: vendors.id,
        client: {
          id: companies.id,
          name: companies.name,
        },
        vendor: {
          id: companies.id,
          name: companies.name,
        },
        addedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .leftJoin(companies, eq(vendors.clientId, companies.id))
      .leftJoin(users, eq(vendors.addedBy, users.id))
      .where(eq(vendors.status, "pending"))
      .orderBy(desc(vendors.createdAt));
  }
}

export const storage = new DatabaseStorage();

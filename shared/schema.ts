import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Visit tracking table
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  page: varchar("page").notNull(),
  userId: varchar("user_id").references(() => users.id), // Optional - tracks visits by authenticated users
  sessionId: varchar("session_id"), // Track unique sessions
  country: varchar("country"),
  city: varchar("city"),
  visitedAt: timestamp("visited_at").defaultNow(),
});

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull(), // Removed unique constraint to allow same email with different categories
  password: varchar("password").notNull(), // Password is required for auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["job_seeker", "recruiter", "client", "admin"] }).notNull().default("job_seeker"),
  categoryId: integer("category_id").references(() => categories.id),
  headline: text("headline"),
  summary: text("summary"),
  location: varchar("location"),
  industry: varchar("industry"),
  facebookUrl: varchar("facebook_url"),
  twitterUrl: varchar("twitter_url"),
  instagramUrl: varchar("instagram_url"),
  resumeUrl: varchar("resume_url"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // Subscription and payment fields
  subscriptionPlan: varchar("subscription_plan", { enum: ["free", "recruiter", "enterprise"] }).notNull().default("free"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "trial", "cancelled", "expired"] }).notNull().default("trial"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professional experience
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  company: varchar("company").notNull(),
  location: varchar("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Education
export const education = pgTable("education", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  institution: varchar("institution").notNull(),
  degree: varchar("degree").notNull(),
  fieldOfStudy: varchar("field_of_study"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  grade: varchar("grade"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Skills
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  endorsements: integer("endorsements").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Companies/Clients
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  industry: varchar("industry"),
  size: varchar("size"),
  website: varchar("website"),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  followers: integer("followers").default(0),
  country: varchar("country"),
  state: varchar("state"),
  city: varchar("city"),
  zipCode: varchar("zip_code"),
  location: varchar("location"),
  phone: varchar("phone"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  recruiterId: varchar("recruiter_id").references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: varchar("location"),
  country: varchar("country"),
  state: varchar("state"),
  city: varchar("city"),
  zipCode: varchar("zip_code"),
  jobType: varchar("job_type", { enum: ["full_time", "part_time", "contract", "remote"] }),
  employmentType: varchar("employment_type", { enum: ["full_time", "part_time", "contract", "remote"] }).notNull(),
  experienceLevel: varchar("experience_level", { enum: ["entry", "mid", "senior", "executive"] }).notNull(),
  salary: varchar("salary"),
  benefits: text("benefits"),
  skills: text("skills").array(),
  isActive: boolean("is_active").default(true),
  applicationCount: integer("application_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  applicantId: varchar("applicant_id").references(() => users.id).notNull(),
  resumeUrl: varchar("resume_url"),
  // originalFilename removed - causing database errors
  coverLetter: text("cover_letter"),
  status: varchar("status", { enum: ["pending", "reviewed", "interview", "rejected", "hired"] }).default("pending"),
  appliedAt: timestamp("applied_at").defaultNow(),
  // Resume scoring columns
  matchScore: integer("match_score").default(0),
  skillsScore: integer("skills_score").default(0),
  experienceScore: integer("experience_score").default(0),
  educationScore: integer("education_score").default(0),
  companyScore: integer("company_score").default(0),
  isProcessed: boolean("is_processed").default(false),
  processingError: text("processing_error"),
  parsedSkills: text("parsed_skills").array(),
  parsedExperience: text("parsed_experience"),
  parsedEducation: text("parsed_education"),
  parsedCompanies: text("parsed_companies").array(),
});

// Connections
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Professional Groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  industry: varchar("industry"),
  memberCount: integer("member_count").default(0),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Memberships
export const groupMemberships = pgTable("group_memberships", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ["member", "admin", "moderator"] }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// External User Invitations
export const externalInvitations = pgTable("external_invitations", {
  id: serial("id").primaryKey(),
  inviterUserId: varchar("inviter_user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  message: text("message"),
  status: varchar("status", { enum: ["pending", "accepted", "declined", "expired"] }).default("pending"),
  inviteToken: varchar("invite_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Candidate Assignments - Auto-assigned job seekers to recruiter jobs
export const jobCandidateAssignments = pgTable("job_candidate_assignments", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  candidateId: varchar("candidate_id").references(() => users.id).notNull(),
  recruiterId: varchar("recruiter_id").references(() => users.id).notNull(),
  status: varchar("status", { enum: ["assigned", "contacted", "interested", "not_interested"] }).default("assigned"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  contactedAt: timestamp("contacted_at"),
  notes: text("notes"),
}, (table) => ({
  // Unique constraint to prevent duplicate assignments
  uniqueAssignment: index("job_candidate_assignments_unique").on(table.jobId, table.candidateId, table.recruiterId),
}));



// Services lookup table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors (service providers for companies)
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  services: text("services"), // Will store service codes or IDs
  status: varchar("status").default("pending"),
  approvedBy: varchar("approved_by"),
  // Vendor-specific address fields
  vendorCity: varchar("vendor_city"),
  vendorState: varchar("vendor_state"),
  vendorZipCode: varchar("vendor_zip_code"),
  vendorAddress: text("vendor_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Location tables with hierarchical relationships
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ISO country code
  createdAt: timestamp("created_at").defaultNow(),
});

export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull().references(() => countries.id),
  name: varchar("name").notNull(),
  code: varchar("code", { length: 10 }), // State/province code
  createdAt: timestamp("created_at").defaultNow(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  stateId: integer("state_id").notNull().references(() => states.id),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories for jobs and profiles
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many, one }) => ({
  experiences: many(experiences),
  education: many(education),
  skills: many(skills),
  category: one(categories, {
    fields: [users.categoryId],
    references: [categories.id],
  }),
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  sentConnections: many(connections, { relationName: "sender" }),
  receivedConnections: many(connections, { relationName: "receiver" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  jobApplications: many(jobApplications),
  groupMemberships: many(groupMemberships),
}));

export const experienceRelations = relations(experiences, ({ one }) => ({
  user: one(users, {
    fields: [experiences.userId],
    references: [users.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  user: one(users, {
    fields: [education.userId],
    references: [users.id],
  }),
}));

export const skillRelations = relations(skills, ({ one }) => ({
  user: one(users, {
    fields: [skills.userId],
    references: [users.id],
  }),
}));

export const companyRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  jobs: many(jobs),
  clientVendors: many(vendors, { relationName: "client" }),
  vendorClients: many(vendors, { relationName: "vendor" }),
}));

export const jobRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  recruiter: one(users, {
    fields: [jobs.recruiterId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [jobs.categoryId],
    references: [categories.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id],
  }),
  applicant: one(users, {
    fields: [jobApplications.applicantId],
    references: [users.id],
  }),
}));

export const connectionRelations = relations(connections, ({ one }) => ({
  sender: one(users, {
    fields: [connections.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [connections.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

// Social Media Posts table for tracking automatic job postings
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  platformsPosted: jsonb("platforms_posted").notNull(), // Array of platforms: ['facebook', 'twitter', 'instagram']
  results: jsonb("results").notNull(), // Results from each platform posting attempt
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialMediaPostRelations = relations(socialMediaPosts, ({ one }) => ({
  job: one(jobs, {
    fields: [socialMediaPosts.jobId],
    references: [jobs.id],
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const groupRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
}));

export const groupMembershipRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export const vendorRelations = relations(vendors, ({ one }) => ({
  company: one(companies, {
    fields: [vendors.companyId],
    references: [companies.id],
  }),
}));

export const serviceRelations = relations(services, ({ many }) => ({
  vendors: many(vendors),
}));

export const countryRelations = relations(countries, ({ many }) => ({
  states: many(states),
}));

export const stateRelations = relations(states, ({ one, many }) => ({
  country: one(countries, {
    fields: [states.countryId],
    references: [countries.id],
  }),
  cities: many(cities),
}));

export const cityRelations = relations(cities, ({ one }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  users: many(users),
  jobs: many(jobs),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(education).omit({
  id: true,
  createdAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  endorsements: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  followers: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  isActive: true,
  applicationCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  status: true,
  // rank: true, // Temporarily removed since rank column doesn't exist in DB
  appliedAt: true,
  // updatedAt: true, // Temporarily removed since updatedAt column doesn't exist in DB
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertExternalInvitationSchema = createInsertSchema(externalInvitations).omit({
  id: true,
  inviteToken: true,
  expiresAt: true,
  inviterUserId: true,
  createdAt: true,
});

export const insertJobCandidateAssignmentSchema = createInsertSchema(jobCandidateAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
});

export const insertStateSchema = createInsertSchema(states).omit({
  id: true,
  createdAt: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Education = typeof education.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type ExternalInvitation = typeof externalInvitations.$inferSelect;
export type InsertExternalInvitation = z.infer<typeof insertExternalInvitationSchema>;
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema>;
export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type JobCandidateAssignment = typeof jobCandidateAssignments.$inferSelect;
export type InsertJobCandidateAssignment = z.infer<typeof insertJobCandidateAssignmentSchema>;

// Visit tracking
export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  visitedAt: true,
});
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

import type { 
  User, 
  Experience, 
  Education, 
  Skill, 
  Company, 
  Job, 
  JobApplication, 
  Connection, 
  Message, 
  Group 
} from "@shared/schema";

// Re-export Company type for use in other files
export type { Company } from "@shared/schema";

export interface UserProfile extends User {
  experiences?: Experience[];
  education?: Education[];
  skills?: Skill[];
  company?: Company;
}

export interface JobWithCompany extends Job {
  company?: Company;
  recruiter?: User;
  applications?: JobApplication[];
}

export interface JobApplicationWithDetails extends JobApplication {
  job?: JobWithCompany;
  applicant?: User;
}

export interface ConnectionWithUser extends Connection {
  requester?: User;
  receiver?: User;
  user?: User;
}

export interface MessageWithUser extends Message {
  sender?: User;
  receiver?: User;
  otherUser?: User;
}

export interface GroupWithDetails extends Group {
  creator?: User;
  memberCount?: number;
  role?: string;
  joinedAt?: Date;
}

export interface DashboardStats {
  totalUsers?: number;
  activeJobs?: number;
  revenue?: number;
  activeSessions?: number;
  applications?: number;
  interviews?: number;
  followers?: number;
  profileViews?: number;
  connectionRequests?: number;
}

export interface SearchFilters {
  jobType?: string;
  experienceLevel?: string;
  location?: string;
  industry?: string;
  search?: string;
}

export interface FileUpload {
  file: File;
  url?: string;
  type: 'resume' | 'profile-image' | 'company-logo';
}

export interface NotificationData {
  id: string;
  type: 'connection_request' | 'job_application' | 'message' | 'job_alert';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
}

export type UserType = 'job_seeker' | 'recruiter' | 'client' | 'admin';

export interface AuthUser extends User {
  userType: UserType;
}

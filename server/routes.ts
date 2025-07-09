import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage, pool } from "./storage";
import { setupAuth } from "./auth";
import { initializeSocialMediaPoster } from "./social-media";
import { z } from "zod";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";
import sgMail from '@sendgrid/mail';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { 
  insertExperienceSchema,
  insertEducationSchema,
  insertSkillSchema,
  insertCompanySchema,
  insertJobSchema,
  insertJobApplicationSchema,
  insertConnectionSchema,
  insertMessageSchema,
  insertGroupSchema,
  insertVendorSchema,
  insertExternalInvitationSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Configure multer for image uploads (company logos, profile pictures)
const imageUpload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and GIF images are allowed'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for images
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication FIRST before any other routes
  setupAuth(app);

  // Initialize social media poster
  let socialMediaPoster: any = null;
  initializeSocialMediaPoster(pool).then(poster => {
    socialMediaPoster = poster;
    if (poster) {
      console.log('✓ Social media posting enabled for Facebook, Twitter, and Instagram');
    } else {
      console.log('ℹ Social media posting disabled - configure API keys to enable automatic posting');
    }
  });
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static('uploads'));
  
  // Serve static files from logos directory
  app.use('/logos', express.static('logos'));
  
  // Public routes (before auth middleware)
  
  // Password reset routes
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with that email exists, we've sent password reset instructions." });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to user
      await storage.updateUserResetToken(user.id, resetToken, resetExpires);

      // Generate reset link based on environment
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.NODE_ENV === 'production' ? 'pingjob.com' : (process.env.REPLIT_DOMAINS || 'localhost:5000');
      const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;
      
      // For now, log the reset link to console for testing
      console.log(`\n=== PASSWORD RESET REQUEST ===`);
      console.log(`Email: ${email}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`Expires: ${resetExpires}`);
      console.log(`================================\n`);
      
      // Send password reset email
      try {
        if (process.env.SENDGRID_API_KEY) {
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          
          const msg = {
            to: email,
            from: process.env.SENDGRID_VERIFIED_SENDER_EMAIL || 'krupashankar@gmail.com',
            subject: 'Reset Your PingJob Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>You requested to reset your password for your PingJob account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                  This email was sent by PingJob. If you have questions, please contact support.
                </p>
              </div>
            `,
            text: `Reset Your Password - Click this link: ${resetLink} (expires in 1 hour)`
          };
          
          await sgMail.send(msg);
          console.log(`Password reset email sent to ${email}`);
        }
      } catch (emailError: any) {
        console.error('Failed to send password reset email:', emailError);
        console.error('Error details:', emailError.response?.body);
        
        // If it's a sender verification error, provide helpful guidance
        if (emailError.response?.body?.errors?.[0]?.field === 'from') {
          console.log('\n🔧 SENDGRID SETUP REQUIRED:');
          console.log('1. Go to https://app.sendgrid.com/');
          console.log('2. Navigate to Settings > Sender Authentication');
          console.log('3. Click "Verify a Single Sender"');
          console.log('4. Add and verify your email address');
          console.log('5. Update SENDGRID_VERIFIED_SENDER_EMAIL with the verified email\n');
        }
      }

      res.json({ message: "If an account with that email exists, we've sent password reset instructions." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      console.log(`Reset password attempt - Token: ${token.substring(0, 10)}...`);
      console.log(`User found:`, !!user);
      console.log(`Token expiry:`, user?.resetTokenExpiry);
      console.log(`Current time:`, new Date());
      
      if (!user || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearUserResetToken(user.id);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });


  // Get open jobs and vendors for a company (public endpoint)
  app.get('/api/companies/:id/details', async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }

      // Get active jobs for the company
      const jobs = await storage.getJobsByCompany(companyId);
      const openJobs = jobs.filter((job: any) => job.isActive === true);

      // Get vendors for the company
      const vendors = await storage.getClientVendors(companyId);

      res.json({
        openJobs,
        vendors
      });
    } catch (error) {
      console.error("Error fetching company details:", error);
      res.status(500).json({ message: "Failed to fetch company details" });
    }
  });

  // Test database connection endpoint
  app.get('/api/test-db-connection', async (req, res) => {
    try {
      const result = await storage.getUserByEmail('test@example.com');
      res.json({ 
        status: 'success', 
        userFound: !!result,
        userEmail: result?.email || 'not found'
      });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  // Authentication middleware for session-based auth
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session?.user) {
      req.user = req.session.user; // Set user on request object
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  const customAuth = isAuthenticated;



  // Global search endpoint with location support
  app.get('/api/search', async (req, res) => {
    try {
      const query = (req.query.q || req.query.query) as string;
      const location = req.query.location as string;
      
      if (!query || query.trim().length < 1) {
        return res.json({ companies: [], jobs: [] });
      }

      // Build filters object for job search
      const filters: any = {};
      if (location && location.trim()) {
        filters.location = location.trim();
      }

      // Search companies and jobs in parallel
      const [companies, jobs] = await Promise.all([
        storage.searchCompanies(query, 10),
        storage.searchJobs(query, filters)
      ]);

      res.json({
        companies: companies || [],
        jobs: jobs || []
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Profile routes
  app.get('/api/profile/:id', async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', customAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch('/api/profile/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      
      // Ensure user can only update their own profile or admin can update any
      if (req.user.id !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to update this profile" });
      }
      
      const updateData = req.body;
      const updatedProfile = await storage.updateUserProfile(userId, updateData);
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Experience routes
  app.get('/api/experiences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const experiences = await storage.getUserExperiences(userId);
      res.json(experiences);
    } catch (error) {
      console.error("Error fetching experiences:", error);
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });

  app.post('/api/experiences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertExperienceSchema.parse({ ...req.body, userId });
      const experience = await storage.addExperience(validatedData);
      res.json(experience);
    } catch (error) {
      console.error("Error adding experience:", error);
      res.status(500).json({ message: "Failed to add experience" });
    }
  });

  app.put('/api/experiences/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const experience = await storage.updateExperience(id, req.body);
      res.json(experience);
    } catch (error) {
      console.error("Error updating experience:", error);
      res.status(500).json({ message: "Failed to update experience" });
    }
  });

  app.delete('/api/experiences/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExperience(id);
      res.json({ message: "Experience deleted successfully" });
    } catch (error) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ message: "Failed to delete experience" });
    }
  });

  // Education routes
  app.get('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const education = await storage.getUserEducation(userId);
      res.json(education);
    } catch (error) {
      console.error("Error fetching education:", error);
      res.status(500).json({ message: "Failed to fetch education" });
    }
  });

  app.post('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertEducationSchema.parse({ ...req.body, userId });
      const education = await storage.addEducation(validatedData);
      res.json(education);
    } catch (error) {
      console.error("Error adding education:", error);
      res.status(500).json({ message: "Failed to add education" });
    }
  });

  app.put('/api/education/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const education = await storage.updateEducation(id, req.body);
      res.json(education);
    } catch (error) {
      console.error("Error updating education:", error);
      res.status(500).json({ message: "Failed to update education" });
    }
  });

  app.delete('/api/education/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEducation(id);
      res.json({ message: "Education deleted successfully" });
    } catch (error) {
      console.error("Error deleting education:", error);
      res.status(500).json({ message: "Failed to delete education" });
    }
  });

  // Skills routes
  app.get('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertSkillSchema.parse({ ...req.body, userId });
      const skill = await storage.addSkill(validatedData);
      res.json(skill);
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSkill(id);
      res.json({ message: "Skill deleted successfully" });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // Get ALL companies for job creation dropdown
  app.get('/api/companies/all', async (req, res) => {
    try {
      const companies = await storage.getCompanies(50000); // Load all companies
      res.json(companies);
    } catch (error) {
      console.error("Error fetching all companies:", error);
      res.status(500).json({ message: "Failed to fetch all companies" });
    }
  });

  // Company routes - Get all companies for job creation
  app.get('/api/companies/all', async (req, res) => {
    try {
      const companies = await storage.getCompanies(50000); // Get all approved companies
      res.json(companies);
    } catch (error) {
      console.error("Error fetching all companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get top 100 companies prioritized by vendor and job count
  app.get('/api/companies/top', async (req, res) => {
    try {
      const companies = await storage.getTopCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching top companies:", error);
      res.status(500).json({ message: "Failed to fetch top companies" });
    }
  });

  // Public stats endpoint for home page
  app.get('/api/platform/stats', async (req, res) => {
    try {
      const totalUsers = await storage.getTotalUserCount();
      const totalCompanies = await storage.getTotalCompanyCount();
      const activeJobs = await storage.getTotalActiveJobsCount();
      
      res.json({
        totalUsers,
        totalCompanies,
        activeJobs
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // Company routes - Get companies with optional search
  app.get('/api/companies', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 0;
      
      console.log(`DEBUG ROUTE: /api/companies called with query="${query}", limit=${limit}`);
      
      if (query && query !== 'undefined' && query.length >= 2) {
        // Search with dynamic limit - higher for job creation
        const searchLimit = limit > 100 ? Math.min(limit, 1000) : 100;
        console.log(`DEBUG ROUTE: Calling searchCompanies with query="${query}", searchLimit=${searchLimit}`);
        const companies = await storage.searchCompanies(query, searchLimit);
        console.log(`DEBUG ROUTE: searchCompanies returned ${companies.length} companies`);
        res.json(companies);
      } else if (limit > 0) {
        // Allow high limits for complete company access
        const actualLimit = limit >= 50000 ? 50000 : limit;
        console.log(`DEBUG ROUTE: limit=${limit}, actualLimit=${actualLimit}`);
        console.log(`DEBUG ROUTE: Calling getCompanies with limit=${actualLimit}`);
        const companies = await storage.getCompanies(actualLimit);
        console.log(`DEBUG ROUTE: getCompanies returned ${companies.length} companies`);
        res.json(companies);
      } else {
        // No query and no limit - return top 100 companies
        console.log(`DEBUG ROUTE: Returning top 100 companies`);
        const companies = await storage.getTopCompanies();
        res.json(companies);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get pending companies (admin only) - Must come before /:id route
  app.get('/api/companies/pending', async (req: any, res) => {
    try {
      // Temporarily bypass auth for testing
      const pendingCompanies = await storage.getPendingCompanies();
      res.json(pendingCompanies);
    } catch (error) {
      console.error("Error fetching pending companies:", error);
      res.status(500).json({ message: "Failed to fetch pending companies" });
    }
  });

  // Search endpoint for vendor auto-complete - Must come before /:id route
  // Real-time search endpoint for home page (accessible to all visitors)
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 5;
      
      if (!query || query.length < 2) {
        return res.json({ companies: [], jobs: [] });
      }
      
      console.log(`Home page search: "${query}"`);
      
      // Search companies (limited results for visitors)
      const companies = await storage.searchCompanies(query, limit);
      
      // Search jobs (limited results for visitors)
      const jobs = await storage.searchJobsForHomePage(query, limit);
      
      res.json({ 
        companies: companies || [], 
        jobs: jobs || [] 
      });
    } catch (error) {
      console.error('Error in home page search:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/companies/search', async (req, res) => {
    try {
      const query = req.query.query as string;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      console.log(`DEBUG SEARCH: Searching companies with query="${query}", limit=${limit}`);
      const companies = await storage.searchCompanies(query, limit);
      console.log(`DEBUG SEARCH: Found ${companies.length} companies matching "${query}"`);
      
      res.json(companies);
    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({ error: 'Failed to search companies' });
    }
  });

  app.get('/api/companies/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Update company endpoint (PUT)
  app.put('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const updateData = {
        name: req.body.name,
        industry: req.body.industry,
        description: req.body.description,
        website: req.body.website,
        phone: req.body.phone,
        email: req.body.email,
        location: req.body.location,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        zipCode: req.body.zipCode,
        employeeCount: req.body.employeeCount,
        foundedYear: req.body.foundedYear,
        logoUrl: req.body.logoUrl
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });
      
      const updatedCompany = await storage.updateCompany(id, updateData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Update company endpoint (PATCH) - for partial updates with file upload support
  app.patch('/api/companies/:id', imageUpload.single('logo'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const updateData: any = {
        name: req.body.name,
        industry: req.body.industry,
        description: req.body.description,
        website: req.body.website,
        phone: req.body.phone,
        email: req.body.email,
        location: req.body.location,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        zipCode: req.body.zipCode,
        employeeCount: req.body.employeeCount ? parseInt(req.body.employeeCount) : null,
        foundedYear: req.body.foundedYear ? parseInt(req.body.foundedYear) : null,
        updatedAt: new Date()
      };

      // Handle logo upload if provided
      if (req.file) {
        // Ensure logos directory exists
        const logosDir = path.join(process.cwd(), 'logos');
        if (!fs.existsSync(logosDir)) {
          fs.mkdirSync(logosDir, { recursive: true });
        }
        
        // Move file from uploads to logos directory
        const originalExt = path.extname(req.file.originalname);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${originalExt}`;
        const newPath = path.join('logos', filename);
        
        fs.renameSync(req.file.path, newPath);
        updateData.logoUrl = `logos/${filename}`;
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });
      
      const updatedCompany = await storage.updateCompany(id, updateData);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Company logo upload route
  app.post('/api/upload/company-logo', imageUpload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Ensure logos directory exists
      const logosDir = path.join(process.cwd(), 'logos');
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const ext = path.extname(req.file.originalname);
      const filename = `company-logo-${timestamp}${ext}`;
      const logoUrl = `logos/${filename}`;

      // Rename file to have proper extension
      const oldPath = req.file.path;
      const newPath = path.join('logos', filename);
      
      fs.renameSync(oldPath, newPath);

      res.json({ logoUrl });
    } catch (error) {
      console.error("Error uploading company logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const companyData = { ...req.body, userId: user.id };
      
      // Auto-approve companies created by paid subscribers (recruiters and clients)
      if (user.userType === 'recruiter' || user.userType === 'client') {
        companyData.status = 'approved';
        companyData.approvedBy = user.id;
        console.log(`Auto-approving company for paid subscriber: ${user.email} (${user.userType})`);
      } else {
        // Default to pending for job seekers and others
        companyData.status = 'pending';
        console.log(`Company creation pending approval for: ${user.email} (${user.userType})`);
      }
      
      const validatedData = insertCompanySchema.parse(companyData);
      const company = await storage.createCompany(validatedData);
      
      res.json(company);
    } catch (error: any) {
      console.error("Error creating company:", error?.message);
      
      if (error?.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Update company status (admin only)
  app.patch('/api/companies/:id/status', async (req: any, res) => {
    try {
      // Use admin user for testing
      const userId = "admin-krupa";
      
      const companyId = parseInt(req.params.id);
      const { status, approvedBy } = req.body;
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.updateCompanyStatus(companyId, status, approvedBy || userId);
      res.json(company);
    } catch (error) {
      console.error("Error updating company status:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  // Approve company
  app.put('/api/companies/:id/approve', async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const userId = "admin-krupa";
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.updateCompanyStatus(companyId, "approved", userId);
      res.json(company);
    } catch (error) {
      console.error("Error approving company:", error);
      res.status(500).json({ message: "Failed to approve company" });
    }
  });

  // Reject company
  app.put('/api/companies/:id/reject', async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const userId = "admin-krupa";
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const company = await storage.updateCompanyStatus(companyId, "rejected", userId);
      res.json(company);
    } catch (error) {
      console.error("Error rejecting company:", error);
      res.status(500).json({ message: "Failed to reject company" });
    }
  });

  // Update company address (for testing)
  app.post('/api/companies/:id/update-address', async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { city, state, zipCode, country } = req.body;
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      await storage.updateCompanyAddress(companyId, { city, state, zipCode, country });
      res.json({ message: "Company address updated successfully" });
    } catch (error) {
      console.error("Error updating company address:", error);
      res.status(500).json({ message: "Failed to update company address" });
    }
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.email;
      
      // Check if user is admin
      if (userEmail !== 'krupas@vedsoft.com' && userEmail !== 'krupashankar@gmail.com') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get basic stats
      const jobs = await storage.getJobs({}, 1000);
      const activeJobs = jobs.filter((job: any) => job.status !== 'closed').length;
      
      // Get actual user counts
      const totalUsers = await storage.getTotalUserCount();
      const totalCompanies = await storage.getTotalCompanyCount();
      
      res.json({
        activeJobs,
        totalUsers,
        totalCompanies,
        revenue: 0,
        activeSessions: 0
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Vendor management routes (temporary bypass for testing)
  app.post('/api/vendors', async (req: any, res) => {
    try {
      const vendorData = {
        ...req.body,
        createdBy: 'admin-krupa', // temporary for testing
      };

      const vendor = await storage.addVendor(vendorData);
      res.json(vendor);
    } catch (error) {
      console.error("Error adding vendor:", error);
      res.status(500).json({ message: "Failed to add vendor" });
    }
  });



  app.put('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.updateCompany(id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // ============ RECRUITER FUNCTIONALITY ============
  // NOTE: Specific routes must come before parameterized routes to avoid conflicts

  // Get admin jobs (for homepage display)
  app.get('/api/admin-jobs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const jobs = await storage.getAdminJobs(limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching admin jobs:", error);
      res.status(500).json({ message: "Failed to fetch admin jobs" });
    }
  });

  // Get recruiter jobs (for search only)
  app.get('/api/recruiter-jobs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        jobType: req.query.jobType,
        experienceLevel: req.query.experienceLevel,
        location: req.query.location,
        companyId: req.query.companyId ? parseInt(req.query.companyId as string) : undefined
      };
      const jobs = await storage.getRecruiterJobs(filters, limit);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recruiter jobs:", error);
      res.status(500).json({ message: "Failed to fetch recruiter jobs" });
    }
  });

  // Get recruiter's own jobs (for dashboard)
  app.get('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      const jobs = await storage.getRecruiterOwnJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recruiter's own jobs:", error);
      res.status(500).json({ message: "Failed to fetch recruiter's own jobs" });
    }
  });

  // Individual job route (must come after specific routes)
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // Job routes - Only admin jobs for jobs tab and home page
  app.get('/api/jobs', async (req, res) => {
    try {
      const filters = {
        jobType: req.query.jobType as string,
        experienceLevel: req.query.experienceLevel as string,
        location: req.query.location as string,
        companyId: req.query.companyId ? parseInt(req.query.companyId as string) : undefined,
      };
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      console.log('Jobs API called with filters:', filters, 'limit:', limit);
      console.log('Getting admin jobs only (no recruiter jobs)');
      const jobs = await storage.getJobs(filters, limit);
      console.log('getJobs returned', jobs.length, 'admin jobs');
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Search endpoint - Combines admin and recruiter jobs for search functionality
  app.get('/api/search/jobs', async (req, res) => {
    try {
      const query = req.query.q as string;
      const filters = {
        jobType: req.query.jobType as string,
        experienceLevel: req.query.experienceLevel as string,
        location: req.query.location as string,
        companyId: req.query.companyId ? parseInt(req.query.companyId as string) : undefined,
      };
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      console.log('Searching all jobs (admin + recruiter) with query:', query);
      const jobs = await storage.searchJobs(query, filters);
      console.log('Search returned', jobs.length, 'jobs');
      res.json(jobs);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.put('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const updateSchema = insertJobSchema.partial();
      const jobData = updateSchema.parse(req.body);
      
      // If platform admin is editing the job, mark it to appear on home page
      if (req.user?.userType === 'admin' || req.user?.id === 'admin-krupa') {
        jobData.recruiterId = 'admin-krupa'; // This will make it appear in home page
        console.log(`Admin user ${req.user?.id} updating job ${jobId} - setting recruiterId to admin-krupa`);
      }
      
      console.log('Updating job with data:', jobData);
      
      const updatedJob = await storage.updateJob(jobId, jobData);
      console.log('Updated job result:', { id: updatedJob.id, recruiterId: updatedJob.recruiterId, title: updatedJob.title });
      
      res.json(updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      console.log("Creating job with data:", req.body);
      console.log("User:", user);
      
      // Check if recruiter has reached the 10-job limit
      if (user.userType === 'recruiter') {
        const jobCount = await storage.getJobCountByRecruiter(user.id);
        if (jobCount >= 10) {
          return res.status(400).json({ 
            message: "Job limit reached. Recruiters can create a maximum of 10 jobs." 
          });
        }
      }
      
      // Auto-generate location from city, state, country and map jobType to employmentType
      const jobData = { 
        ...req.body, 
        recruiterId: user.id,
        employmentType: req.body.jobType || "full_time" // Map jobType to employmentType for database
      };
      if (jobData.city && jobData.state && jobData.country) {
        jobData.location = `${jobData.city}, ${jobData.state}, ${jobData.country}`;
      }
      
      const validatedData = insertJobSchema.parse(jobData);
      console.log("Validated data:", validatedData);
      
      const job = await storage.createJob(validatedData);
      
      // Automatic social media posting (temporarily disabled due to missing table)
      // if (socialMediaPoster && job.id && job.companyId) {
      //   try {
      //     // Get company name for social media post
      //     const company = await storage.getCompany(job.companyId);
      //     
      //     const jobPostData = {
      //       id: job.id,
      //       title: job.title,
      //       company: company?.name || 'Company',
      //       location: job.location || 'Remote',
      //       description: job.description,
      //       employmentType: job.employmentType,
      //       experienceLevel: job.experienceLevel,
      //       salary: job.salary
      //     };
      //     
      //     console.log('🚀 Posting job to social media platforms...');
      //     const socialResults = await socialMediaPoster.postJobToAllPlatforms(jobPostData);
      //     
      //     const successCount = socialResults.filter((r: any) => r.success).length;
      //     console.log(`✓ Social media posting completed: ${successCount}/${socialResults.length} platforms successful`);
      //     
      //     // Add social media results to response
      //     (job as any).socialMediaResults = socialResults;
      //   } catch (socialError) {
      //     console.error('Social media posting failed:', socialError);
      //     // Don't fail the job creation if social media posting fails
      //   }
      // }
      
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      console.error("Error details:", (error as Error).message);
      if ((error as any).errors) {
        console.error("Validation errors:", (error as any).errors);
      }
      res.status(500).json({ 
        message: "Failed to create job", 
        error: (error as Error).message,
        details: (error as any).errors || []
      });
    }
  });



  app.delete('/api/jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJob(id);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Job Application routes
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      console.log("Fetching applications for user:", userId);
      const applications = await storage.getUserJobApplications(userId, limit);
      console.log("Applications found:", applications.length);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/jobs/:id/applications', isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const applications = await storage.getJobApplications(jobId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.post('/api/applications', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const resumeUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      const validatedData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId: parseInt(req.body.jobId),
        applicantId: userId,
        resumeUrl,
      });
      
      const application = await storage.createJobApplication(validatedData);
      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.patch('/api/applications/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const application = await storage.updateJobApplicationStatus(id, status);
      res.json(application);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  app.delete('/api/applications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJobApplication(id);
      res.json({ message: "Application withdrawn successfully" });
    } catch (error) {
      console.error("Error withdrawing application:", error);
      res.status(500).json({ message: "Failed to withdraw application" });
    }
  });

  // Resume scoring helper functions
  function calculateSkillsMatch(userSkills: any[], jobSkills: string[], jobRequirements: string): number {
    if (!userSkills || userSkills.length === 0) return 0;
    
    const userSkillNames = userSkills.map(s => s.name.toLowerCase());
    const allJobSkills = [...(jobSkills || []), ...extractSkillsFromText(jobRequirements)];
    
    let matchCount = 0;
    const maxScore = 4; // Skills worth up to 4 points
    
    for (const jobSkill of allJobSkills) {
      const skillLower = jobSkill.toLowerCase();
      if (userSkillNames.some(userSkill => 
          userSkill.includes(skillLower) || skillLower.includes(userSkill)
      )) {
        matchCount++;
      }
    }
    
    // Score based on percentage of skills matched, up to maxScore
    const skillMatchRatio = Math.min(matchCount / Math.max(allJobSkills.length, 3), 1);
    return Math.round(skillMatchRatio * maxScore);
  }

  function calculateExperienceMatch(userExperiences: any[], jobExperienceLevel: string, jobRequirements: string): number {
    if (!userExperiences || userExperiences.length === 0) return 0;
    
    const totalYears = userExperiences.reduce((total, exp) => {
      const years = extractYearsFromDuration(exp.duration || "");
      return total + years;
    }, 0);
    
    const requiredYears = getRequiredYearsForLevel(jobExperienceLevel);
    const maxScore = 3; // Experience worth up to 3 points
    
    if (totalYears >= requiredYears) {
      return maxScore;
    } else {
      // Partial credit based on years ratio
      return Math.round((totalYears / requiredYears) * maxScore);
    }
  }

  function calculateEducationMatch(userEducation: any[], jobRequirements: string): number {
    if (!userEducation || userEducation.length === 0) return 0;
    
    const maxScore = 3; // Education worth up to 3 points
    const educationKeywords = ["bachelor", "master", "phd", "degree", "computer science", "engineering"];
    const reqLower = jobRequirements.toLowerCase();
    
    // Check if job requires specific education
    const requiresEducation = educationKeywords.some(keyword => reqLower.includes(keyword));
    
    if (!requiresEducation) {
      return 1; // Give some credit if education not specifically required
    }
    
    // Score based on highest education level
    const hasAdvanced = userEducation.some(edu => 
      edu.degree.toLowerCase().includes("master") || 
      edu.degree.toLowerCase().includes("phd")
    );
    
    const hasBachelor = userEducation.some(edu => 
      edu.degree.toLowerCase().includes("bachelor")
    );
    
    if (hasAdvanced) return maxScore;
    if (hasBachelor) return Math.round(maxScore * 0.8);
    return Math.round(maxScore * 0.4);
  }

  function extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      "javascript", "python", "java", "react", "node.js", "typescript", "css", "html",
      "sql", "mongodb", "postgresql", "aws", "docker", "kubernetes", "git", "agile",
      "scrum", "project management", "leadership", "communication", "problem solving"
    ];
    
    const textLower = text.toLowerCase();
    return commonSkills.filter(skill => textLower.includes(skill));
  }

  function extractYearsFromDuration(duration: string): number {
    const yearMatch = duration.match(/(\d+)\s*year/i);
    const monthMatch = duration.match(/(\d+)\s*month/i);
    
    let years = yearMatch ? parseInt(yearMatch[1]) : 0;
    let months = monthMatch ? parseInt(monthMatch[1]) : 0;
    
    return years + (months / 12);
  }

  function getRequiredYearsForLevel(level: string): number {
    switch (level?.toLowerCase()) {
      case "entry": return 0;
      case "mid": return 3;
      case "senior": return 5;
      case "executive": return 10;
      default: return 2;
    }
  }

  // Get application score
  app.get('/api/applications/:id/score', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get the application with basic data
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify user owns this application
      if (application.applicantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the job details to analyze against
      const job = await storage.getJob(application.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Process the resume if not already processed
      let scoreData;
      try {
        // Get user's profile data for scoring
        const userProfile = await storage.getUser(application.applicantId);
        const userSkills = await storage.getUserSkills(application.applicantId);
        const userExperiences = await storage.getUserExperiences(application.applicantId);
        const userEducation = await storage.getUserEducation(application.applicantId);
        
        // Use enhanced resume parsing algorithm with company matching
        const { parseResumeContent, extractJobRequirements, calculateMatchingScore } = await import('./resume-parser');
        
        // Create resume content from user profile data
        const resumeText = `
          Skills: ${userSkills.map((s: any) => s.name).join(', ')}
          Experience: ${userExperiences.map((e: any) => `${e.position} at ${e.company} (${e.duration || '2-3 years'})`).join('. ')}
          Education: ${userEducation.map((e: any) => `${e.degree} from ${e.institution} (${e.year || '2020'})`).join('. ')}
          Companies: ${userExperiences.map((e: any) => e.company).join(', ')}
        `;
        
        // Parse resume content
        const parsedResume = await parseResumeContent(resumeText);
        
        // Get company information for job
        let jobCompany = null;
        let companyName = '';
        if (job.companyId) {
          jobCompany = await storage.getCompany(job.companyId);
          companyName = jobCompany ? jobCompany.name : '';
        }
        
        // Extract job requirements including company name
        const jobRequirements = await extractJobRequirements({
          title: job.title,
          description: job.description || '',
          requirements: job.requirements || '',
          companyName: companyName
        });
        
        // Calculate comprehensive matching score
        const matchingScore = calculateMatchingScore(parsedResume, jobRequirements);
        
        scoreData = {
          id: application.id,
          matchScore: matchingScore.totalScore,
          skillsScore: matchingScore.skillsScore,
          experienceScore: matchingScore.experienceScore,
          educationScore: matchingScore.educationScore,
          companyScore: matchingScore.companyScore,
          isProcessed: true,
          processingError: null,
          parsedSkills: matchingScore.breakdown.skillsMatched,
          parsedExperience: userExperiences.map((e: any) => `${e.position} at ${e.company}`).join(", "),
          parsedEducation: userEducation.map((e: any) => `${e.degree} from ${e.institution}`).join(", "),
          parsedCompanies: matchingScore.breakdown.companiesMatched
        };
        
        console.log(`Calculated score for application ${applicationId}:`, scoreData);
      } catch (processingError) {
        console.error("Error processing resume score:", processingError);
        scoreData = {
          id: application.id,
          matchScore: 0,
          skillsScore: 0,
          experienceScore: 0,
          educationScore: 0,
          companyScore: 0,
          isProcessed: false,
          processingError: "Failed to process resume scoring",
          parsedSkills: [],
          parsedExperience: "",
          parsedEducation: "",
          parsedCompanies: []
        };
      }
      
      res.json(scoreData);
    } catch (error) {
      console.error("Error fetching application score:", error);
      res.status(500).json({ message: "Failed to fetch application score" });
    }
  });

  // Approve all vendors endpoint
  app.post('/api/vendors/approve-all', async (req: any, res) => {
    try {
      console.log('DEBUG: Approving all vendors in database...');
      const result = await storage.approveAllVendors();
      res.json({ 
        message: `Successfully approved ${result.updated} vendors`,
        updated: result.updated 
      });
    } catch (error) {
      console.error("Error approving all vendors:", error);
      res.status(500).json({ message: "Failed to approve vendors" });
    }
  });

  // Get vendors for a specific company (for job details page)
  app.get('/api/companies/:companyId/vendors', async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const isAuthenticated = !!req.user;
      
      console.log(`DEBUG: /api/companies/${companyId}/vendors - isAuthenticated: ${isAuthenticated}`);
      
      // Get all vendors for this company
      const allVendors = await storage.getClientVendors(companyId);
      console.log(`DEBUG: Found ${allVendors.length} total vendors`);
      
      // Remove duplicates first
      const uniqueVendors = allVendors.filter((vendor: any, index: number, self: any[]) => 
        index === self.findIndex(v => v.vendor_id === vendor.vendor_id)
      );
      console.log(`DEBUG: After removing duplicates: ${uniqueVendors.length} vendors`);
      
      // Filter by authentication status:
      // - Authenticated users see all vendors (approved + pending)
      // - Unauthenticated users see only approved vendors, limited to 3
      let vendorsToShow;
      if (isAuthenticated) {
        vendorsToShow = uniqueVendors; // Show all vendors for authenticated users
      } else {
        const approvedVendors = uniqueVendors.filter((vendor: any) => vendor.status === 'approved');
        vendorsToShow = approvedVendors.slice(0, 3); // Limit to 3 approved vendors for unauthenticated
        console.log(`DEBUG: Unauthenticated user - showing ${vendorsToShow.length} of ${approvedVendors.length} approved vendors`);
      }
      
      const totalVendors = isAuthenticated ? uniqueVendors.length : uniqueVendors.filter((v: any) => v.status === 'approved').length;
      
      res.json({
        vendors: vendorsToShow,
        totalCount: totalVendors,
        showingCount: vendorsToShow.length,
        isAuthenticated
      });
    } catch (error) {
      console.error("Error fetching company vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Connection routes
  app.get('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connections = await storage.getUserConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.get('/api/connection-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      res.status(500).json({ message: "Failed to fetch connection requests" });
    }
  });

  app.post('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertConnectionSchema.parse({
        ...req.body,
        senderId: userId,
      });
      const connection = await storage.createConnection(validatedData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.put('/api/connections/:id/status', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const connection = await storage.updateConnectionStatus(id, status);
      res.json(connection);
    } catch (error) {
      console.error("Error updating connection status:", error);
      res.status(500).json({ message: "Failed to update connection status" });
    }
  });

  // Category-based networking endpoints
  app.get('/api/categories/with-user-counts', async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithUserCounts();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories with user counts:", error);
      res.status(500).json({ message: "Failed to fetch categories with user counts" });
    }
  });

  app.get('/api/categories/:categoryId/users', isAuthenticated, async (req: any, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const currentUserId = req.user.id;
      const users = await storage.getUsersByCategory(categoryId, currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by category:", error);
      res.status(500).json({ message: "Failed to fetch users by category" });
    }
  });

  // Messaging endpoints
  app.get('/api/messages/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const otherUserId = req.params.otherUserId;
      const messages = await storage.getUserMessages(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/messages/unread/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });

  // Import company addresses from CSV
  app.post("/api/companies/import-addresses", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({ error: "Authentication required" });
      }

      const fs = await import('fs');
      const { parse } = await import('csv-parse');
      
      console.log('Starting address import process...');
      
      const csvData: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      const stream = fs.default.createReadStream('attached_assets/CSZ_1750183986263.csv');
      
      stream.pipe(parser);
      
      parser.on('data', (row) => {
        csvData.push(row);
      });
      
      parser.on('end', async () => {
        let updated = 0;
        let notFound = 0;
        
        console.log(`Processing ${csvData.length} companies...`);
        
        // Process in smaller batches to avoid timeout
        const batchSize = 50;
        const totalBatches = Math.ceil(Math.min(csvData.length, 500) / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
          const startIndex = batch * batchSize;
          const endIndex = Math.min(startIndex + batchSize, csvData.length);
          const currentBatch = csvData.slice(startIndex, endIndex);
          
          console.log(`Processing batch ${batch + 1}/${totalBatches} (${currentBatch.length} companies)...`);
          
          for (const csvCompany of currentBatch) {
            try {
              // Find ALL companies with this name and update them
              const existingCompanies = await storage.searchCompanies(csvCompany.name, 50);
              if (existingCompanies.length > 0) {
                // Update all matching companies with the same address data
                for (const company of existingCompanies) {
                  await storage.updateCompany(company.id, {
                    country: csvCompany.country,
                    state: csvCompany.state,
                    city: csvCompany.city?.trim(),
                    zipCode: csvCompany.zip_code,
                  });
                }
                updated += existingCompanies.length;
              } else {
                notFound++;
              }
            } catch (error) {
              console.error(`Error updating ${csvCompany.name}:`, error);
              notFound++;
            }
          }
          
          console.log(`Batch ${batch + 1} completed. Updated: ${updated}, Not found: ${notFound}`);
        }
        
        const result = {
          success: true,
          updated,
          notFound,
          total: Math.min(csvData.length, 500),
          message: `Import completed: ${updated} companies updated, ${notFound} not found`
        };
        
        console.log('Final import result:', result);
        res.json(result);
      });
      
      parser.on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: "CSV parsing failed" });
      });
      
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Import failed" });
    }
  });

  // Complete CSV import with ALL columns and original IDs
  app.post("/api/companies/complete-import", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(403).json({ error: "Authentication required" });
      }

      const fs = await import('fs');
      const { parse } = await import('csv-parse');
      
      console.log('Starting complete CSV import with ALL columns and original IDs...');
      
      // Clear all existing companies and related data
      await storage.clearAllCompanies();
      console.log('Existing data cleared successfully.');
      
      const csvData: any[] = [];
      let imported = 0;
      let errors = 0;
      
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      const stream = fs.default.createReadStream('attached_assets/CSZ_1750183986263.csv');
      
      stream.pipe(parser);
      
      parser.on('data', (row) => {
        csvData.push(row);
      });
      
      parser.on('end', async () => {
        console.log(`Processing ${csvData.length} companies with ALL columns from CSV...`);
        
        // Process in batches
        const batchSize = 100;
        const totalBatches = Math.ceil(csvData.length / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
          const startIndex = batch * batchSize;
          const endIndex = Math.min(startIndex + batchSize, csvData.length);
          const currentBatch = csvData.slice(startIndex, endIndex);
          
          console.log(`Processing batch ${batch + 1}/${totalBatches} (${currentBatch.length} companies)...`);
          
          for (const csvCompany of currentBatch) {
            try {
              // Import with ALL columns from CSV, preserving original ID
              const insertQuery = `
                INSERT INTO companies (id, name, country, state, city, location, zip_code, website, phone, status, approved_by, user_id, logo_url, created_at, updated_at, followers, industry, size, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 0, NULL, NULL, NULL)
              `;
              
              const { cleanPool } = await import('./clean-neon');
              await cleanPool.query(insertQuery, [
                parseInt(csvCompany.id),           // Preserve original ID from CSV
                csvCompany.name,
                csvCompany.country,
                csvCompany.state,
                csvCompany.city?.trim(),
                csvCompany.location,
                csvCompany.zip_code,
                csvCompany.website,
                csvCompany.phone,
                csvCompany.status || 'approved',
                csvCompany.approved_by || req.user.id,
                csvCompany.user_id || req.user.id,
                csvCompany.logo_url
              ]);
              
              imported++;
            } catch (error) {
              console.error(`Error importing ${csvCompany.name} (ID: ${csvCompany.id}):`, error);
              errors++;
            }
          }
          
          console.log(`Batch ${batch + 1} completed. Imported: ${imported}, Errors: ${errors}`);
        }
        
        // Reset sequence to continue from highest ID
        const { cleanPool } = await import('./clean-neon');
        await cleanPool.query('SELECT setval(\'companies_id_seq\', (SELECT MAX(id) FROM companies))');
        
        const result = {
          success: true,
          imported,
          errors,
          total: csvData.length,
          message: `Complete import finished: ${imported} companies imported with ALL columns and original IDs preserved`
        };
        
        console.log('Final import result:', result);
        res.json(result);
      });
      
      parser.on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: "CSV parsing failed" });
      });
      
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Import failed" });
    }
  });

  // Skills routes
  app.get('/api/skills/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertSkillSchema.parse({
        ...req.body,
        userId,
      });
      const skill = await storage.addSkill(validatedData);
      res.json(skill);
    } catch (error) {
      console.error("Error adding skill:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.delete('/api/skills/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSkill(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting skill:", error);
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });

  // Experience routes
  app.get('/api/experience/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const experience = await storage.getUserExperiences(userId);
      res.json(experience);
    } catch (error) {
      console.error("Error fetching experience:", error);
      res.status(500).json({ message: "Failed to fetch experience" });
    }
  });

  app.post('/api/experience', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertExperienceSchema.parse({
        ...req.body,
        userId,
      });
      const experience = await storage.addExperience(validatedData);
      res.json(experience);
    } catch (error) {
      console.error("Error adding experience:", error);
      res.status(500).json({ message: "Failed to add experience" });
    }
  });

  app.put('/api/experience/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const experience = await storage.updateExperience(id, req.body);
      res.json(experience);
    } catch (error) {
      console.error("Error updating experience:", error);
      res.status(500).json({ message: "Failed to update experience" });
    }
  });

  app.delete('/api/experience/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExperience(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ message: "Failed to delete experience" });
    }
  });

  // Education routes
  app.get('/api/education/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const education = await storage.getUserEducation(userId);
      res.json(education);
    } catch (error) {
      console.error("Error fetching education:", error);
      res.status(500).json({ message: "Failed to fetch education" });
    }
  });

  app.post('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertEducationSchema.parse({
        ...req.body,
        userId,
      });
      const education = await storage.addEducation(validatedData);
      res.json(education);
    } catch (error) {
      console.error("Error adding education:", error);
      res.status(500).json({ message: "Failed to add education" });
    }
  });

  app.put('/api/education/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const education = await storage.updateEducation(id, req.body);
      res.json(education);
    } catch (error) {
      console.error("Error updating education:", error);
      res.status(500).json({ message: "Failed to update education" });
    }
  });

  app.delete('/api/education/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEducation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting education:", error);
      res.status(500).json({ message: "Failed to delete education" });
    }
  });

  // Message routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const otherUserId = req.params.userId;
      const messages = await storage.getUserMessages(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(id);
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Group routes
  app.get('/api/groups', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const groups = await storage.getGroups(limit);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get('/api/user/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertGroupSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const group = await storage.createGroup(validatedData);
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.post('/api/groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupId = parseInt(req.params.id);
      await storage.joinGroup(groupId, userId);
      res.json({ message: "Successfully joined group" });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  // Global Search API - Search both companies and jobs
  app.get('/api/search/:query', async (req, res) => {
    try {
      const query = req.params.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.length < 2) {
        return res.json({ companies: [], jobs: [] });
      }

      // Search companies and jobs in parallel
      const [companies, jobs] = await Promise.all([
        storage.searchCompanies(query, limit),
        storage.searchJobs(query, { limit })
      ]);

      res.json({
        companies: companies || [],
        jobs: jobs || [],
        total: (companies?.length || 0) + (jobs?.length || 0)
      });
    } catch (error) {
      console.error("Error in global search:", error);
      res.status(500).json({ 
        message: "Failed to perform search",
        companies: [],
        jobs: []
      });
    }
  });

  // Vendor Management Routes
  app.get('/api/clients/:id/vendors', isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const vendors = await storage.getClientVendors(clientId);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching client vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.addVendor({
        ...validatedData,
        addedBy: req.user.id,
      });
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error adding vendor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add vendor" });
    }
  });

  app.put('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedVendor = await storage.updateVendor(vendorId, updateData);
      res.json(updatedVendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // Fix TEK Systems vendor location
  app.get('/api/admin/fix-tek-systems', async (req, res) => {
    try {
      console.log("Fixing TEK Systems vendor location...");
      
      // Use raw SQL to update vendor record
      const result = await pool.query(`
        UPDATE vendors 
        SET company_id = $1
        WHERE id = $2 AND name = $3
        RETURNING *
      `, [6812, 1, 'TEK Systems']);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "TEK Systems vendor not found" });
      }
      
      console.log("TEK Systems vendor updated successfully:", result.rows[0]);
      res.json({ 
        message: "TEK Systems location fixed successfully",
        vendor: result.rows[0] 
      });
    } catch (error) {
      console.error("Error fixing TEK Systems:", error);
      res.status(500).json({ message: "Failed to fix TEK Systems location" });
    }
  });

  // File upload endpoints
  app.post('/api/upload/resume', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const fileName = `resume_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join('uploads', fileName);
      
      // Move file to proper location
      fs.renameSync(req.file.path, filePath);
      
      // Update user profile with resume URL
      await storage.updateUserProfile(userId, { resumeUrl: `/uploads/${fileName}` });
      
      res.json({ 
        message: "Resume uploaded successfully",
        resumeUrl: `/uploads/${fileName}`
      });
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to upload resume" });
    }
  });

  app.post('/api/upload/logo', isAuthenticated, upload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const fileName = `logo_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join('uploads', fileName);
      
      // Move file to proper location
      fs.renameSync(req.file.path, filePath);
      
      res.json({ 
        message: "Logo uploaded successfully",
        logoUrl: `/uploads/${fileName}`
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  app.post('/api/upload/profile-image', isAuthenticated, upload.single('profileImage'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const fileName = `profile_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join('uploads', fileName);
      
      // Move file to proper location
      fs.renameSync(req.file.path, filePath);
      
      // Update user profile with image URL
      await storage.updateUserProfile(userId, { profileImageUrl: `/uploads/${fileName}` });
      
      res.json({ 
        message: "Profile image uploaded successfully",
        profileImageUrl: `/uploads/${fileName}`
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Location API endpoints
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get('/api/states/:countryId', async (req, res) => {
    try {
      const countryId = parseInt(req.params.countryId);
      if (isNaN(countryId)) {
        return res.status(400).json({ message: "Invalid country ID" });
      }
      const states = await storage.getStatesByCountry(countryId);
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  app.get('/api/cities/:stateId', async (req, res) => {
    try {
      const stateId = parseInt(req.params.stateId);
      if (isNaN(stateId)) {
        return res.status(400).json({ message: "Invalid state ID" });
      }
      const cities = await storage.getCitiesByState(stateId);
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Admin Routes - Platform Admin can approve vendors and edit jobs
  app.get('/api/admin/vendors/pending', isAuthenticated, async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();
      res.json(pendingVendors);
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
      res.status(500).json({ message: "Failed to fetch pending vendors" });
    }
  });

  // Vendor routes
  app.post('/api/vendors', async (req: any, res) => {
    try {
      // Use admin user for testing
      const userId = "admin-krupa";
      const validatedData = insertVendorSchema.parse({
        ...req.body,
        status: 'pending', // All new vendors start as pending
        createdBy: userId
      });
      
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.patch('/api/admin/vendors/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { status } = req.body;
      const vendor = await storage.updateVendorStatus(vendorId, status, req.user.id);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor status:", error);
      res.status(500).json({ message: "Failed to update vendor status" });
    }
  });

  app.patch('/api/admin/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const validatedData = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(jobId, validatedData);
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.patch('/api/admin/companies/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { status } = req.body;
      const company = await storage.updateCompany(companyId, { status });
      res.json(company);
    } catch (error) {
      console.error("Error updating company status:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  // Admin user update endpoint for subscription management
  app.patch('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      const userEmail = req.user.email;
      if (userEmail !== 'krupas@vedsoft.com' && userEmail !== 'krupashankar@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const updateData = req.body;
      
      const updatedUser = await storage.updateUserSubscription(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ message: "Failed to update user subscription" });
    }
  });

  // Category routes - IMPORTANT: Order matters! Specific routes before parameterized ones
  app.get('/api/categories/with-counts', async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithJobCounts();
      res.json(categories);
    } catch (error) {
      console.error("Failed to get categories with counts:", error);
      res.status(500).json({ error: "Failed to get categories with counts" });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get latest jobs by category (for unregistered users)
  app.get('/api/categories/:categoryId/jobs', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const jobs = await storage.getLatestJobsByCategory(categoryId, limit);
      res.json(jobs);
    } catch (error) {
      console.error("Failed to get jobs by category:", error);
      res.status(500).json({ error: "Failed to get jobs by category" });
    }
  });

  // Get top companies by category with job and vendor counts
  app.get('/api/categories/:categoryId/companies', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const companies = await storage.getTopCompaniesByCategory(categoryId, limit);
      res.json(companies);
    } catch (error) {
      console.error("Failed to get companies by category:", error);
      res.status(500).json({ error: "Failed to get companies by category" });
    }
  });

  // Get single category by ID
  app.get('/api/categories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Location routes
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  app.get('/api/states/:countryId', async (req, res) => {
    try {
      const { countryId } = req.params;
      const states = await storage.getStatesByCountry(parseInt(countryId));
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  app.get('/api/cities/:stateId', async (req, res) => {
    try {
      const { stateId } = req.params;
      const cities = await storage.getCitiesByState(parseInt(stateId));
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });



  // External invitation endpoints
  app.post("/api/external-invitations", isAuthenticated, async (req, res) => {
    try {
      const { email, firstName, lastName, message } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Generate unique token and set expiry (30 days)
      const crypto = await import('crypto');
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const invitation = await storage.createExternalInvitation({
        email,
        firstName,
        lastName,
        message,
        inviterUserId: (req.user as any).id,
        inviteToken: inviteToken,
        expiresAt,
      });

      // Send invitation email
      const { sendInvitationEmail } = await import('./email');
      const inviterName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;
      const recipientName = firstName ? `${firstName} ${lastName || ''}`.trim() : email;
      
      const emailSent = await sendInvitationEmail(
        email,
        recipientName,
        inviterName,
        inviteToken,
        message
      );

      if (!emailSent) {
        console.error("Failed to send invitation email to:", email);
        
        // Display invitation details for manual sharing
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NODE_ENV === 'production' ? 'pingjob.com' : (process.env.REPLIT_DOMAINS || 'localhost:5000');
        const invitationLink = `${protocol}://${host}/invite/${inviteToken}`;
        
        console.log('\n=== MANUAL INVITATION SHARING ===');
        console.log(`To: ${email}`);
        console.log(`Name: ${firstName} ${lastName || ''}`.trim());
        console.log(`From: ${(req.user as any).firstName} ${(req.user as any).lastName}`);
        console.log(`Message: ${message || 'None'}`);
        console.log(`Invitation Link: ${invitationLink}`);
        console.log('================================\n');
        console.log('Share this link manually while SendGrid verification is pending.');
      }

      const responseProtocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const responseHost = process.env.NODE_ENV === 'production' ? 'pingjob.com' : (process.env.REPLIT_DOMAINS || 'localhost:5000');
      
      res.status(201).json({ 
        ...invitation, 
        emailSent,
        invitationLink: emailSent ? undefined : `${responseProtocol}://${responseHost}/invite/${inviteToken}`
      });
    } catch (error) {
      console.error("Create external invitation error:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get user's external invitations
  app.get("/api/external-invitations", isAuthenticated, async (req, res) => {
    try {
      const invitations = await storage.getExternalInvitationsByInviter((req.user as any).id);
      res.json(invitations);
    } catch (error) {
      console.error("Get external invitations error:", error);
      res.status(500).json({ message: "Failed to get invitations" });
    }
  });

  // Get invitation details (public endpoint)
  app.get("/api/external-invitations/:token/details", async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getExternalInvitation(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already processed" });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation expired" });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Get invitation details error:", error);
      res.status(500).json({ message: "Failed to get invitation details" });
    }
  });

  // Accept external invitation (public endpoint)
  app.post("/api/external-invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = req.body;
      
      const invitation = await storage.getExternalInvitation(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already processed" });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation expired" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);

      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new user account
      const newUser = await storage.createUser({
        id: userId,
        email: invitation.email,
        firstName: firstName || invitation.firstName || '',
        lastName: lastName || invitation.lastName || '',
        password: hashedPassword,
        userType: 'job_seeker'
      });

      // Update invitation status
      await storage.updateExternalInvitationStatus(invitation.id, 'accepted', new Date());
      
      res.json({ 
        message: "Invitation accepted successfully", 
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error) {
      console.error("Accept external invitation error:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Password reset endpoints
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

      const success = await storage.setPasswordResetToken(email, resetToken, resetExpiry);
      
      if (success) {
        console.log(`Password reset token for ${email}: ${resetToken}`);
        res.json({ 
          message: "If an account with that email exists, a password reset link has been sent.",
          resetToken // For testing - remove in production
        });
      } else {
        res.status(500).json({ message: "Failed to generate reset token" });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const success = await storage.resetPassword(token, newPassword);
      
      if (success) {
        res.json({ message: "Password reset successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired reset token" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recruiter's own jobs
  app.get('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }
      
      const jobs = await storage.getRecruiterOwnJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching recruiter jobs:", error);
      res.status(500).json({ message: "Failed to fetch recruiter jobs" });
    }
  });

  // Create job as recruiter (auto-assigns candidates)
  app.post('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      // Check if recruiter has reached the 10-job limit
      const jobCount = await storage.getJobCountByRecruiter(req.user.id);
      if (jobCount >= 10) {
        return res.status(400).json({ 
          message: "Job limit reached. Recruiters can create a maximum of 10 jobs." 
        });
      }

      const validatedData = insertJobSchema.parse({
        ...req.body,
        recruiterId: req.user.id
      });

      const job = await storage.createJob(validatedData);
      
      // Auto-assign candidates by category
      if (job.categoryId) {
        await storage.autoAssignCandidatesToJob(job.id, req.user.id);
      }

      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating recruiter job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Get assigned candidates for a job
  app.get('/api/recruiter/jobs/:jobId/candidates', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      const jobId = parseInt(req.params.jobId);
      const assignments = await storage.getJobCandidateAssignments(jobId, req.user.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      res.status(500).json({ message: "Failed to fetch job candidates" });
    }
  });

  // Update assignment status
  app.patch('/api/recruiter/assignments/:assignmentId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      const assignmentId = parseInt(req.params.assignmentId);
      const { status, notes } = req.body;
      
      await storage.updateAssignmentStatus(assignmentId, status, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating assignment status:", error);
      res.status(500).json({ message: "Failed to update assignment status" });
    }
  });

  // Create connection with candidate
  app.post('/api/recruiter/connect/:candidateId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      const candidateId = req.params.candidateId;
      const connection = await storage.createRecruiterCandidateConnection(req.user.id, candidateId);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  // Get candidate resume score
  app.get('/api/recruiter/candidate/:candidateId/score/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'recruiter') {
        return res.status(403).json({ message: "Access denied. Recruiter role required." });
      }

      const candidateId = req.params.candidateId;
      const jobId = parseInt(req.params.jobId);
      
      const score = await storage.getCandidateResumeScore(candidateId, jobId);
      res.json(score);
    } catch (error) {
      console.error("Error fetching candidate score:", error);
      res.status(500).json({ message: "Failed to fetch candidate score" });
    }
  });

  // ENTERPRISE ROUTES - Similar to recruiter but with unlimited job posting and access to all job seekers
  
  // Get enterprise's own jobs (unlimited)
  app.get('/api/enterprise/jobs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'client') {
        return res.status(403).json({ message: "Access denied. Enterprise role required." });
      }
      
      const jobs = await storage.getRecruiterOwnJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching enterprise jobs:", error);
      res.status(500).json({ message: "Failed to fetch enterprise jobs" });
    }
  });

  // Create job as enterprise (unlimited)
  app.post('/api/enterprise/jobs', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'client') {
        return res.status(403).json({ message: "Access denied. Enterprise role required." });
      }

      // No job limit for enterprise users
      const validatedData = insertJobSchema.parse({
        ...req.body,
        recruiterId: req.user.id
      });

      const job = await storage.createJob(validatedData);
      
      // Auto-assign candidates by category (same as recruiter)
      if (job.categoryId) {
        await storage.autoAssignCandidatesToJob(job.id, req.user.id);
      }

      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating enterprise job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Get ALL job seekers for enterprise access
  app.get('/api/enterprise/job-seekers', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'client') {
        return res.status(403).json({ message: "Access denied. Enterprise role required." });
      }

      const allJobSeekers = await storage.getAllJobSeekers();
      res.json(allJobSeekers);
    } catch (error) {
      console.error("Error fetching all job seekers:", error);
      res.status(500).json({ message: "Failed to fetch job seekers" });
    }
  });

  // Get assigned candidates for an enterprise job
  app.get('/api/enterprise/jobs/:jobId/candidates', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'client') {
        return res.status(403).json({ message: "Access denied. Enterprise role required." });
      }

      const jobId = parseInt(req.params.jobId);
      const assignments = await storage.getJobCandidateAssignments(jobId, req.user.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching job candidates:", error);
      res.status(500).json({ message: "Failed to fetch job candidates" });
    }
  });

  // Debug endpoints to help fix candidate assignment issues
  app.get('/api/debug/categories-with-users', isAuthenticated, async (req: any, res) => {
    try {
      const { cleanPool } = await import('./clean-neon');
      const result = await cleanPool.query(`
        SELECT u.category_id, c.name, COUNT(u.id) as user_count
        FROM users u
        JOIN categories c ON u.category_id = c.id
        WHERE u.user_type = 'job_seeker'
        GROUP BY u.category_id, c.name
        ORDER BY user_count DESC
        LIMIT 10
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  });

  // Quick fix: Update job to use category 1 (which should have job seekers)
  app.post('/api/debug/fix-job-category', isAuthenticated, async (req: any, res) => {
    try {
      const { cleanPool } = await import('./clean-neon');
      
      // First check what categories have job seekers
      const categoriesResult = await cleanPool.query(`
        SELECT u.category_id, c.name, COUNT(u.id) as user_count
        FROM users u
        JOIN categories c ON u.category_id = c.id
        WHERE u.user_type = 'job_seeker'
        GROUP BY u.category_id, c.name
        ORDER BY user_count DESC
        LIMIT 1
      `);
      
      if (categoriesResult.rows.length === 0) {
        return res.status(400).json({ error: 'No categories with job seekers found' });
      }
      
      const bestCategory = categoriesResult.rows[0];
      
      // Update the recruiter's job to use this category
      const updateResult = await cleanPool.query(`
        UPDATE jobs 
        SET category_id = $1
        WHERE recruiter_id = $2
        RETURNING id, title, category_id
      `, [bestCategory.category_id, req.user.id]);
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: 'No jobs found for this recruiter' });
      }
      
      res.json({
        success: true,
        message: `Updated job to use category ${bestCategory.category_id} (${bestCategory.name}) which has ${bestCategory.user_count} job seekers`,
        updatedJob: updateResult.rows[0],
        category: bestCategory
      });
    } catch (error) {
      console.error('Error fixing job category:', error);
      res.status(500).json({ error: 'Failed to fix job category' });
    }
  });

  // Update job category for testing
  app.patch('/api/debug/job/:jobId/category/:categoryId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId, categoryId } = req.params;
      const { cleanPool } = await import('./clean-neon');
      const result = await cleanPool.query(`
        UPDATE jobs 
        SET category_id = $1
        WHERE id = $2 AND recruiter_id = $3
        RETURNING *
      `, [categoryId, jobId, req.user.id]);
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating job category:', error);
      res.status(500).json({ error: 'Failed to update job category' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}

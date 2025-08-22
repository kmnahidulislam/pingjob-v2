import { type Express } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
// insertJobApplicationSchema import removed - using direct object creation
import { cleanPool as pool } from "./clean-neon";
import { initializeSocialMediaPoster, SocialMediaPoster } from "./social-media";
import Stripe from "stripe";
// Enhanced authentication middleware with debugging
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.user || req.session?.user) {
    // Ensure req.user is set for consistency
    req.user = req.user || req.session.user;
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: "Too many upload attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain' // Allow text files for testing
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Initialize social media poster
let socialMediaPoster: SocialMediaPoster | null = null;

export function registerRoutes(app: Express) {
  // Initialize social media integration
  initializeSocialMediaPoster(pool).then(poster => {
    socialMediaPoster = poster;
    if (poster) {
      console.log('✅ Social media integration initialized successfully');
    } else {
      console.log('⚠️ Social media integration disabled - missing credentials');
    }
  }).catch(error => {
    console.error('❌ Failed to initialize social media integration:', error);
  });
  
  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Input validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // SECURITY: Premium accounts require payment - redirect to payment page
      if (userType && (userType === "recruiter" || userType === "client")) {
        return res.status(402).json({ 
          message: "Premium account types require payment. Redirecting to payment page.",
          requiresPayment: true,
          userType: userType,
          userData: { email, firstName, lastName }
        });
      }
      
      // Only allow job_seeker for free registration
      if (userType && userType !== "job_seeker") {
        return res.status(400).json({ 
          message: "Invalid user type. Free registration only supports job_seeker accounts." 
        });
      }
      
      // Check if user exists
      const checkResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password using scrypt
      const { hashPassword } = await import('./simple-auth');
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert new user
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, user_type
      `, [userId, email.toLowerCase().trim(), hashedPassword, firstName.trim(), lastName.trim(), 'job_seeker']);
      
      const user = insertResult.rows[0];
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      // Set user in session
      req.session.user = userData;
      req.user = userData;
      
      res.status(201).json(userData);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Premium user creation endpoint (after payment confirmation)
  app.post("/api/create-premium-user", async (req, res) => {
    try {
      const { email, firstName, lastName, userType, paymentConfirmed } = req.body;
      
      // Validate payment confirmation
      if (!paymentConfirmed) {
        return res.status(400).json({ message: "Payment confirmation required" });
      }
      
      // Validate required fields
      if (!email || !firstName || !lastName || !userType) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Only allow premium user types
      if (userType !== "recruiter" && userType !== "client") {
        return res.status(400).json({ message: "Invalid user type for premium account" });
      }
      
      // Check if user already exists
      const checkResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Generate a temporary password - user will need to set their password via password reset
      const tempPassword = Math.random().toString(36).substr(2, 12);
      const { hashPassword } = await import('./simple-auth');
      const hashedPassword = await hashPassword(tempPassword);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert new user
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, user_type
      `, [userId, email.toLowerCase().trim(), hashedPassword, firstName.trim(), lastName.trim(), userType]);
      
      const user = insertResult.rows[0];
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      // Log them in immediately
      req.session.user = userData;
      req.user = userData;
      
      console.log(`Premium user created: ${email} (${userType}) - temp password: ${tempPassword}`);
      
      res.status(201).json({
        ...userData,
        message: "Premium account created successfully. Please check your email for login instructions."
      });
    } catch (error) {
      console.error("Premium user creation error:", error);
      res.status(500).json({ message: "Failed to create premium account" });
    }
  });



  // User authentication endpoints
  app.get('/api/user', (req: any, res) => {
    console.log('GET /api/user - Session exists:', !!req.session);
    console.log('GET /api/user - Session user (direct):', !!req.session?.user);
    console.log('GET /api/user - Passport user:', !!req.user);
    console.log('GET /api/user - Session ID:', req.session?.id);
    console.log('GET /api/user - Full session data:', req.session);
    
    if (req.user || req.session?.user) {
      const user = req.user || req.session.user;
      console.log('Returning authenticated user:', user.email);
      res.json(user);
    } else {
      console.log('No authenticated user found in session or passport');
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Old /api/applications endpoint - DISABLED
  app.post('/api/applications', (req, res) => {
    res.status(410).json({ message: "This endpoint has been disabled. Use /api/apply instead." });
  });

  // Simple /api/apply endpoint (what the frontend actually uses)
  app.post('/api/apply', isAuthenticated, uploadLimiter, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No resume uploaded" });
      }
      
      const resumeUrl = `/uploads/${req.file.filename}`;
      
      // Verify file was saved correctly
      const uploadedFilePath = path.join('uploads', req.file.filename);
      if (!fs.existsSync(uploadedFilePath)) {
        return res.status(500).json({ message: "File upload failed" });
      }

      // Update filename mapping
      try {
        const mappingPath = path.join('.', 'filename-mapping.json');
        let mapping: any = {};
        
        if (fs.existsSync(mappingPath)) {
          mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        }
        
        mapping[req.file.filename] = req.file.originalname;
        fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
      } catch (error) {
        console.error('Error updating filename mapping:', error);
      }

      const applicationData = {
        jobId: parseInt(req.body.jobId),
        applicantId: userId,
        resumeUrl,
        status: 'pending' as const,
        appliedAt: new Date(),
        coverLetter: req.body.coverLetter || null,
        matchScore: 0,
        skillsScore: 0,
        experienceScore: 0,
        educationScore: 0,
        companyScore: 0,
        isProcessed: false
      };

      // EXTRA VALIDATION - Only allow manual uploads
      if (!req.file || !req.file.filename) {
        throw new Error('Only manual file uploads allowed');
      }
      
      const application = await storage.createJobApplication(applicationData);
      
      res.json({
        id: application.id,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Basic endpoints to keep system functional
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // Add job counts for each category
      const categoriesWithJobCounts = await Promise.all(
        categories.map(async (category: any) => {
          try {
            const jobs = await storage.getJobsByCategory(category.id);
            return {
              ...category,
              jobCount: jobs.length
            };
          } catch (error) {
            console.error(`Error getting job count for category ${category.id}:`, error);
            return {
              ...category,
              jobCount: 0
            };
          }
        })
      );
      
      res.json(categoriesWithJobCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Fast endpoint for jobs page with optional category filtering
  app.get('/api/jobs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let jobs;
      if (categoryId) {
        // Get jobs by specific category, sorted by latest (most recent first)
        jobs = await storage.getJobsByCategory(categoryId);
        // Limit results if specified
        if (limit) {
          jobs = jobs.slice(0, limit);
        }
      } else {
        // Get all jobs
        jobs = await storage.getFastJobs(limit);
      }
      
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Platform stats endpoint
  app.get('/api/platform-stats', async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  app.get('/api/admin-jobs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const jobs = await storage.getAdminJobs(limit, offset);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get('/api/companies/top', async (req, res) => {
    try {
      const companies = await storage.getTopCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/platform/stats', async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  app.get('/api/companies/pending', async (req, res) => {
    res.json([]);
  });

  // Job seekers endpoint for profiles sidebar
  app.get('/api/job-seekers', async (req, res) => {
    try {
      const jobSeekers = await storage.getJobSeekers();
      res.json(jobSeekers);
    } catch (error) {
      console.error('Error fetching job seekers:', error);
      res.status(500).json({ message: "Failed to fetch job seekers" });
    }
  });

  app.get('/api/job-applications/for-recruiters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('===== JOB APPLICATIONS REQUEST =====');
      console.log('User:', req.user.email, `(${req.user.userType})`);
      
      const applications = await storage.getJobApplicationsForRecruiters(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications for recruiters:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.get('/api/recruiter/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const jobs = await storage.getRecruiterJobs(req.user.id);
      
      // Add candidate count and resume count for each job
      const jobsWithCounts = await Promise.all(jobs.map(async (job: any) => {
        try {
          // Get job seekers with matching category
          const seekers = await storage.getJobSeekers();
          const matchingCandidates = seekers.filter((seeker: any) => 
            seeker.categoryId === job.categoryId
          );
          
          // Get actual resume applications for this job
          const applications = await storage.getJobApplicationsForJob(job.id);
          const resumeApplications = applications.filter((app: any) => 
            app.resumeUrl && app.resumeUrl.includes('/uploads/')
          );
          
          return {
            ...job,
            candidateCount: matchingCandidates.length,
            resumeCount: resumeApplications.length
          };
        } catch (error) {
          console.error('Error calculating counts for job', job.id, error);
          return {
            ...job,
            candidateCount: 0,
            resumeCount: 0
          };
        }
      }));
      
      res.json(jobsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recruiter jobs" });
    }
  });

  app.get('/api/companies', async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const companies = await storage.getCompanies(
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Company search endpoint specifically for vendor management
  app.get('/api/companies/search', async (req, res) => {
    try {
      const { query, limit = 20 } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }

      if (query.length < 2) {
        return res.json([]);
      }

      const companies = await storage.searchCompanies(query, parseInt(limit as string));
      res.json(companies);
      
    } catch (error) {
      console.error('Error in company search endpoint:', error);
      res.status(500).json({ message: 'Company search failed' });
    }
  });

  // Vendors endpoint for creating vendors
  app.post('/api/vendors', async (req, res) => {
    try {
      const { companyId, name, email, phone, services, description, status } = req.body;
      
      const vendorData = {
        companyId: parseInt(companyId),
        name,
        email,
        phone,
        services,
        status: status || 'pending'
      };

      const vendor = await storage.createVendor(vendorData);
      res.json(vendor);
      
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ message: 'Failed to create vendor' });
    }
  });

  // Get vendors for a specific company
  app.get('/api/companies/:id/vendors', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const vendors = await storage.getCompanyVendors(companyId);
      res.json(vendors);
    } catch (error) {
      console.error('Error fetching company vendors:', error);
      res.status(500).json({ message: 'Failed to fetch vendors' });
    }
  });

  // Company details endpoint - returns jobs and vendors for a company
  app.get('/api/companies/:id/details', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      // Check if user is authenticated
      const isUserAuthenticated = !!(req.user || req.session?.user);
      
      // Get company basic info
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Get active jobs for this company
      const openJobs = await storage.getCompanyJobs(companyId);
      
      // Get vendors for this company  
      const allVendors = await storage.getCompanyVendors(companyId);
      
      // Filter vendors based on authentication status
      let vendors = allVendors;
      let totalVendorCount = allVendors.length;
      
      if (!isUserAuthenticated) {
        // For unauthenticated users: limit to 3 vendors and remove email addresses
        vendors = allVendors.slice(0, 3).map(vendor => ({
          ...vendor,
          email: null // Remove email for unauthenticated users
        }));
      }
      
      const result = {
        ...company,
        openJobs,
        vendors,
        totalVendorCount
      };
      
      console.log(`✅ Company details for ${companyId}: ${openJobs.length} jobs, ${vendors.length} vendors${!isUserAuthenticated ? ' (limited for unauthenticated user)' : ''}`);
      res.json(result);
      
    } catch (error) {
      console.error('Error fetching company details:', error);
      res.status(500).json({ message: 'Failed to fetch company details' });
    }
  });

  // Job seekers endpoint for recruiter candidate viewing
  app.get('/api/job-seekers', async (req, res) => {
    try {
      const jobSeekers = await storage.getJobSeekers();
      res.json(jobSeekers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job seekers" });
    }
  });

  // Resume serving endpoints
  app.head('/api/resume/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log(`Resume request: filename="${filename}"`);
      
      const filePath = path.join('uploads', filename);
      console.log(`Looking for file at: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        console.log('File exists: true');
        res.status(200).end();
      } else {
        console.log('File exists: false');
        console.log(`Resume file not found: ${filename}`);
        
        const availableFiles = fs.readdirSync('uploads');
        console.log('Available files in uploads:', availableFiles);
        
        res.status(404).json({ error: 'Resume file not found' });
      }
    } catch (error) {
      console.error('Error checking resume file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/resume/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      console.log(`Resume download request: filename="${filename}"`);
      
      const filePath = path.join('uploads', filename);
      console.log(`Looking for file at: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.log('File exists: false');
        console.log(`Resume file not found: ${filename}`);
        
        const availableFiles = fs.readdirSync('uploads');
        console.log('Available files in uploads:', availableFiles);
        
        return res.status(404).json({ error: 'Resume file not found' });
      }

      console.log('File exists: true - serving file');
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      const ext = path.extname(filename).toLowerCase();
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.doc') {
        contentType = 'application/msword';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (ext === '.txt') {
        contentType = 'text/plain';
      }

      // Load filename mapping
      let originalFilename = `resume${ext}`;
      try {
        const mappingPath = path.join('.', 'filename-mapping.json');
        if (fs.existsSync(mappingPath)) {
          const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
          originalFilename = mapping[filename] || originalFilename;
        }
      } catch (error) {
        console.log('Could not load filename mapping, using default');
      }

      // Set headers for file download with original filename
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      console.log(`Resume file served successfully: ${filename} as ${originalFilename}`);
      
    } catch (error) {
      console.error('Error serving resume file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Cleanup endpoint for broken applications
  app.post('/api/cleanup-broken-applications', async (req, res) => {
    try {
      console.log('🧹 Starting cleanup of broken applications...');
      
      // Get all applications with resume URLs
      const applications = await storage.getAllJobApplications();
      console.log(`Found ${applications.length} applications to check`);
      
      let deletedCount = 0;
      let validCount = 0;
      
      for (const app of applications) {
        if (!app.resumeUrl || !app.resumeUrl.startsWith('/uploads/')) {
          console.log(`❌ Deleting application ${app.id} - invalid resume URL`);
          await storage.deleteJobApplication(app.id);
          deletedCount++;
          continue;
        }
        
        const filename = app.resumeUrl.replace('/uploads/', '');
        const filePath = path.join('uploads', filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`❌ Deleting application ${app.id} - missing file: ${filename}`);
          await storage.deleteJobApplication(app.id);
          deletedCount++;
        } else {
          validCount++;
        }
      }
      
      console.log(`✅ Cleanup complete: ${deletedCount} deleted, ${validCount} preserved`);
      res.json({ 
        message: 'Cleanup completed successfully',
        deletedCount,
        validCount
      });
      
    } catch (error: any) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({ message: 'Cleanup failed', error: error.message });
    }
  });

  // Manual assignment endpoints
  app.get('/api/users/job-seekers', async (req, res) => {
    try {
      const jobSeekers = await storage.getJobSeekers();
      res.json(jobSeekers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job seekers" });
    }
  });

  app.get('/api/manual-assignments', async (req, res) => {
    try {
      const assignments = await storage.getManualAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/manual-assignments', async (req, res) => {
    try {
      const { jobId, candidateId } = req.body;
      const assignment = await storage.createManualAssignment({
        jobId: parseInt(jobId),
        candidateId,
        recruiterId: (req as any).user?.id || (req as any).session?.user?.id,
        status: 'assigned',
        assignedAt: new Date()
      });
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Get job applications for a specific job (admin only)
  // Individual job details endpoint
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Failed to fetch job details' });
    }
  });

  app.get('/api/jobs/:id/applications', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }

      const applications = await storage.getJobApplications(jobId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({ message: 'Failed to fetch job applications' });
    }
  });

  // Get vendors for a specific job (based on company)
  app.get('/api/jobs/:id/vendors', async (req: any, res) => {
    try {
      const { id } = req.params;
      const allVendors = await storage.getJobVendors(parseInt(id));
      
      // Check if user is authenticated
      const isAuthenticated = req.session?.user || req.user;
      
      if (!isAuthenticated) {
        // For non-authenticated users, show only 3 vendors based on:
        // 1. Most number of clients (estimated by how many jobs they have)
        // 2. Latest to be added (most recent createdAt)
        
        // Get vendor statistics to determine client count
        const vendorsWithStats = await Promise.all(allVendors.map(async (vendor: any) => {
          try {
            // Count jobs associated with this vendor's company as proxy for client count
            const companyJobs = await storage.getCompanyJobs(vendor.companyId);
            return {
              ...vendor,
              estimatedClients: companyJobs.length,
              createdAt: vendor.createdAt || new Date()
            };
          } catch (error) {
            return {
              ...vendor,
              estimatedClients: 0,
              createdAt: vendor.createdAt || new Date()
            };
          }
        }));
        
        // Sort by client count (desc) and then by creation date (desc)
        const sortedVendors = vendorsWithStats.sort((a, b) => {
          if (b.estimatedClients !== a.estimatedClients) {
            return b.estimatedClients - a.estimatedClients;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Return only top 3 vendors
        const limitedVendors = sortedVendors.slice(0, 3);
        
        res.json({
          vendors: limitedVendors,
          isLimited: true,
          totalCount: allVendors.length,
          message: "Sign up to view all available vendors"
        });
      } else {
        // For authenticated users, show all vendors
        res.json({
          vendors: allVendors,
          isLimited: false,
          totalCount: allVendors.length
        });
      }
    } catch (error) {
      console.error('Error fetching job vendors:', error);
      res.status(500).json({ message: 'Failed to fetch vendors' });
    }
  });

  // Global search endpoint for companies and jobs
  app.get('/api/search', async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      if (query.length < 2) {
        return res.json({ companies: [], jobs: [] });
      }

      // Search companies
      const companies = await storage.searchCompanies(query, 20);
      
      // Search jobs by location (zip code, city, state)
      const jobs = await storage.searchJobs(query, 20);
      
      res.json({ companies, jobs });
      
    } catch (error) {
      console.error('Error in search endpoint:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  // Add logout endpoint directly to prevent missing route errors
  // Countries, States, Cities endpoints for location dropdowns - using real database data
  app.get('/api/countries', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, code FROM countries ORDER BY name'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({ message: 'Failed to fetch countries' });
    }
  });

  app.get('/api/states', async (req, res) => {
    try {
      const { countryId } = req.query;
      
      if (!countryId) {
        return res.status(400).json({ message: 'Country ID is required' });
      }
      
      const result = await pool.query(
        'SELECT id, country_id as "countryId", name, code FROM states WHERE country_id = $1 ORDER BY name',
        [countryId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  // Add route to handle /api/states/:countryId format as well
  app.get('/api/states/:countryId', async (req, res) => {
    try {
      const { countryId } = req.params;
      
      const result = await pool.query(
        'SELECT id, country_id as "countryId", name, code FROM states WHERE country_id = $1 ORDER BY name',
        [countryId]
      );
      console.log(`States for country ${countryId}:`, result.rows.length);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  app.get('/api/cities', async (req, res) => {
    try {
      const { stateId } = req.query;
      
      if (!stateId) {
        return res.status(400).json({ message: 'State ID is required' });
      }
      
      const result = await pool.query(
        'SELECT id, state_id as "stateId", name FROM cities WHERE state_id = $1 ORDER BY name',
        [stateId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ message: 'Failed to fetch cities' });
    }
  });

  // Add route to handle /api/cities/:stateId format as well
  app.get('/api/cities/:stateId', async (req, res) => {
    try {
      const { stateId } = req.params;
      
      const result = await pool.query(
        'SELECT id, state_id as "stateId", name FROM cities WHERE state_id = $1 ORDER BY name',
        [stateId]
      );
      console.log(`Cities for state ${stateId}:`, result.rows.length);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ message: 'Failed to fetch cities' });
    }
  });

  // Company creation endpoint
  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const companyData = {
        ...req.body,
        userId: req.user.id,
        // Auto-approve for admin and paying users
        status: (req.user.userType === 'admin' || req.user.userType === 'recruiter' || req.user.userType === 'client') 
          ? 'approved' 
          : 'pending'
      };

      const company = await storage.createCompany(companyData);
      
      res.json({
        id: company.id,
        message: 'Company created successfully'
      });
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Company update endpoint
  app.patch('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }

      console.log('Company update request body:', req.body);

      // Check if body has any fields to update
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
      }

      // Check if company exists
      const existingCompany = await storage.getCompanyById(companyId);
      if (!existingCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Filter out null, undefined, and empty string values
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );

      console.log('Filtered update data:', updateData);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid update data provided' });
      }

      // Update company
      const updatedCompany = await storage.updateCompany(companyId, updateData);
      
      res.json({
        id: updatedCompany.id,
        message: 'Company updated successfully'
      });
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Job creation endpoint
  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const jobData = {
        ...req.body,
        recruiterId: req.user.id, // Automatically assign recruiter from authenticated user
        employmentType: req.body.jobType || req.body.employmentType || 'full_time' // Map jobType to employmentType if needed
      };

      console.log('Creating job with data:', jobData);
      
      const job = await storage.createJob(jobData);
      
      console.log('Job created successfully:', job.id);
      
      // Post to social media platforms if integration is available
      if (socialMediaPoster) {
        try {
          console.log('📱 Attempting to post job to social media platforms...');
          
          // Get company information for the job
          let companyName = 'Company';
          if (job.companyId) {
            try {
              const company = await storage.getCompanyById(job.companyId);
              companyName = company?.name || 'Company';
            } catch (error) {
              console.error('⚠️ Failed to fetch company for social media post:', error);
            }
          }
          
          const socialMediaJob = {
            id: job.id,
            title: job.title || 'New Job Opportunity',
            company: companyName,
            location: job.location || 'Remote',
            description: job.description || '',
            employmentType: job.employmentType || 'full_time',
            experienceLevel: job.experienceLevel || 'Mid-level',
            salary: job.salary
          };
          
          const results = await socialMediaPoster.postJobToAllPlatforms(socialMediaJob);
          console.log('📱 Social media posting results:', results);
        } catch (error) {
          console.error('⚠️ Social media posting failed:', error);
          // Don't fail the job creation if social media posting fails
        }
      } else {
        console.log('📱 Social media posting skipped - integration not available');
      }
      
      res.json({
        id: job.id,
        message: 'Job created successfully'
      });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Job update endpoint
  app.put('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }

      // Check if job exists
      const existingJob = await storage.getJobById(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Update job
      const updatedJob = await storage.updateJob(jobId, req.body);
      
      // Post to social media after successful job update
      if (socialMediaPoster) {
        try {
          console.log('📱 Posting updated job to social media platforms...');
          
          // Get company name for social media post
          let companyName = 'Company';
          if (updatedJob.companyId) {
            try {
              const company = await storage.getCompanyById(updatedJob.companyId);
              companyName = company?.name || 'Company';
            } catch (error) {
              console.error('⚠️ Failed to fetch company for social media post:', error);
            }
          }
          
          const socialMediaJob = {
            id: updatedJob.id,
            title: updatedJob.title || 'Updated Job Opportunity',
            company: companyName,
            location: updatedJob.location || 'Remote',
            description: updatedJob.description || '',
            employmentType: updatedJob.employmentType || 'full_time',
            experienceLevel: updatedJob.experienceLevel || 'Mid-level',
            salary: updatedJob.salary
          };
          
          const results = await socialMediaPoster.postJobToAllPlatforms(socialMediaJob);
          console.log('📱 Social media posting results for updated job:', results);
        } catch (error) {
          console.error('⚠️ Social media posting failed for updated job:', error);
          // Don't fail the job update if social media posting fails
        }
      } else {
        console.log('📱 Social media posting skipped - integration not available');
      }
      
      res.json({
        id: updatedJob.id,
        message: 'Job updated successfully',
        updatedJob
      });
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    console.log('=== LOGOUT ATTEMPT START ===');
    console.log('Session before destroy:', !!req.session?.user);
    
    if (req.session && req.session.user) {
      console.log('Clearing session user data...');
      req.session.user = null;
      delete req.session.user;
      console.log('Session user cleared, destroying session...');
      
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        
        console.log('Session destroyed successfully');
        res.clearCookie('connect.sid', { 
          path: '/',
          httpOnly: true,
          secure: false
        });
        
        console.log('=== LOGOUT COMPLETED ===');
        res.json({ message: "Logged out successfully" });
      });
    } else {
      console.log('No session or user found, clearing cookies anyway');
      res.clearCookie('connect.sid', { 
        path: '/',
        httpOnly: true,
        secure: false
      });
      
      console.log('=== LOGOUT COMPLETED (NO SESSION) ===');
      res.json({ message: "Already logged out" });
    }
  });

  // Stripe payment endpoints
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      
      const { plan = 'recruiter' } = req.body;
      
      // Define subscription details
      const subscriptionDetails = {
        recruiter: { priceId: 'price_recruiter', amount: 4900 }, // $49.00
        client: { priceId: 'price_enterprise', amount: 9900 }   // $99.00
      };
      
      const details = subscriptionDetails[plan as keyof typeof subscriptionDetails] || subscriptionDetails.recruiter;
      
      // Create a PaymentIntent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: details.amount,
        currency: 'usd',
        metadata: {
          plan: plan,
          type: 'subscription'
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: details.amount,
        plan: plan
      });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ 
        error: 'Failed to create payment intent',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });



  console.log('✅ Routes registered successfully - auto-application system disabled');
  return app;
}
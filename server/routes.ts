import { type Express } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
// insertJobApplicationSchema import removed - using direct object creation
import { cleanPool as pool } from "./clean-neon";
// Enhanced authentication middleware with debugging
const isAuthenticated = (req: any, res: any, next: any) => {
  console.log('🔒 Auth check - Session exists:', !!req.session);
  console.log('🔒 Auth check - Session user:', !!req.session?.user);
  console.log('🔒 Auth check - Passport user:', !!req.user);
  
  if (req.user || req.session?.user) {
    // Ensure req.user is set for consistency
    req.user = req.user || req.session.user;
    console.log('🔒 Auth check - PASSED for user:', req.user.email);
    next();
  } else {
    console.log('🔒 Auth check - FAILED - returning 401');
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

export function registerRoutes(app: Express) {
  
  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      // Set user in session and force save
      req.session.user = userData;
      req.user = userData;
      
      // Force session save to ensure persistence
      req.session.save((saveErr: any) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('✅ Session saved successfully for user:', userData.email);
        res.json(userData);
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
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

  // Fast endpoint for jobs page without resume counts
  app.get('/api/jobs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const jobs = await storage.getFastJobs(limit);
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
      const jobs = await storage.getAdminJobs();
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
      
      // Get company basic info
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Get active jobs for this company
      const openJobs = await storage.getCompanyJobs(companyId);
      
      // Get vendors for this company  
      const vendors = await storage.getCompanyVendors(companyId);
      
      const result = {
        ...company,
        openJobs,
        vendors
      };
      
      console.log(`✅ Company details for ${companyId}: ${openJobs.length} jobs, ${vendors.length} vendors`);
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
  app.get('/api/jobs/:id/vendors', async (req, res) => {
    try {
      const { id } = req.params;
      const vendors = await storage.getJobVendors(parseInt(id));
      res.json(vendors);
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
      
      // For now, return companies only since that's what's needed
      // Jobs search can be added later if needed
      res.json({ companies, jobs: [] });
      
    } catch (error) {
      console.error('Error in search endpoint:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  // Add logout endpoint directly to prevent missing route errors
  // Countries, States, Cities endpoints for location dropdowns
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = [
        { id: 1, name: 'United States', code: 'US' },
        { id: 2, name: 'Canada', code: 'CA' },
        { id: 3, name: 'United Kingdom', code: 'GB' },
        { id: 4, name: 'Australia', code: 'AU' },
        { id: 5, name: 'Germany', code: 'DE' },
        { id: 6, name: 'France', code: 'FR' },
        { id: 7, name: 'India', code: 'IN' },
        { id: 8, name: 'Japan', code: 'JP' },
        { id: 9, name: 'South Korea', code: 'KR' },
        { id: 10, name: 'Netherlands', code: 'NL' },
        { id: 11, name: 'Switzerland', code: 'CH' },
        { id: 12, name: 'Sweden', code: 'SE' },
        { id: 13, name: 'Norway', code: 'NO' },
        { id: 14, name: 'Denmark', code: 'DK' },
        { id: 15, name: 'Finland', code: 'FI' }
      ];
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch countries' });
    }
  });

  app.get('/api/states', async (req, res) => {
    try {
      const { countryId } = req.query;
      
      // US States
      if (countryId === '1') {
        const states = [
          { id: 1, name: 'California', countryId: 1 },
          { id: 2, name: 'New York', countryId: 1 },
          { id: 3, name: 'Texas', countryId: 1 },
          { id: 4, name: 'Florida', countryId: 1 },
          { id: 5, name: 'Illinois', countryId: 1 },
          { id: 6, name: 'Pennsylvania', countryId: 1 },
          { id: 7, name: 'Ohio', countryId: 1 },
          { id: 8, name: 'Georgia', countryId: 1 },
          { id: 9, name: 'North Carolina', countryId: 1 },
          { id: 10, name: 'Michigan', countryId: 1 },
          { id: 11, name: 'New Jersey', countryId: 1 },
          { id: 12, name: 'Virginia', countryId: 1 },
          { id: 13, name: 'Washington', countryId: 1 },
          { id: 14, name: 'Arizona', countryId: 1 },
          { id: 15, name: 'Massachusetts', countryId: 1 },
          { id: 16, name: 'Tennessee', countryId: 1 },
          { id: 17, name: 'Indiana', countryId: 1 },
          { id: 18, name: 'Missouri', countryId: 1 },
          { id: 19, name: 'Maryland', countryId: 1 },
          { id: 20, name: 'Wisconsin', countryId: 1 }
        ];
        res.json(states);
      }
      // Canada Provinces
      else if (countryId === '2') {
        const provinces = [
          { id: 21, name: 'Ontario', countryId: 2 },
          { id: 22, name: 'Quebec', countryId: 2 },
          { id: 23, name: 'British Columbia', countryId: 2 },
          { id: 24, name: 'Alberta', countryId: 2 },
          { id: 25, name: 'Manitoba', countryId: 2 },
          { id: 26, name: 'Saskatchewan', countryId: 2 }
        ];
        res.json(provinces);
      }
      // UK Countries
      else if (countryId === '3') {
        const ukCountries = [
          { id: 31, name: 'England', countryId: 3 },
          { id: 32, name: 'Scotland', countryId: 3 },
          { id: 33, name: 'Wales', countryId: 3 },
          { id: 34, name: 'Northern Ireland', countryId: 3 }
        ];
        res.json(ukCountries);
      }
      // Australia States
      else if (countryId === '4') {
        const australianStates = [
          { id: 41, name: 'New South Wales', countryId: 4 },
          { id: 42, name: 'Victoria', countryId: 4 },
          { id: 43, name: 'Queensland', countryId: 4 },
          { id: 44, name: 'Western Australia', countryId: 4 },
          { id: 45, name: 'South Australia', countryId: 4 },
          { id: 46, name: 'Tasmania', countryId: 4 }
        ];
        res.json(australianStates);
      }
      else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch states' });
    }
  });

  app.get('/api/cities', async (req, res) => {
    try {
      const { stateId } = req.query;
      
      // California cities
      if (stateId === '1') {
        const cities = [
          { id: 1, name: 'Los Angeles', stateId: 1 },
          { id: 2, name: 'San Francisco', stateId: 1 },
          { id: 3, name: 'San Diego', stateId: 1 },
          { id: 4, name: 'San Jose', stateId: 1 },
          { id: 5, name: 'Sacramento', stateId: 1 }
        ];
        res.json(cities);
      }
      // New York cities
      else if (stateId === '2') {
        const cities = [
          { id: 11, name: 'New York City', stateId: 2 },
          { id: 12, name: 'Buffalo', stateId: 2 },
          { id: 13, name: 'Rochester', stateId: 2 },
          { id: 14, name: 'Syracuse', stateId: 2 },
          { id: 15, name: 'Albany', stateId: 2 }
        ];
        res.json(cities);
      }
      // Texas cities
      else if (stateId === '3') {
        const cities = [
          { id: 21, name: 'Houston', stateId: 3 },
          { id: 22, name: 'Dallas', stateId: 3 },
          { id: 23, name: 'Austin', stateId: 3 },
          { id: 24, name: 'San Antonio', stateId: 3 },
          { id: 25, name: 'Fort Worth', stateId: 3 }
        ];
        res.json(cities);
      }
      // Add more state/city mappings as needed
      else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cities' });
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

  console.log('✅ Routes registered successfully - auto-application system disabled');
  return app;
}
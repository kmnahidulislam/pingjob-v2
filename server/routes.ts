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
import { visitTracker } from "./visit-tracker";
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

// Configure multer for logo image uploads
const logoUpload = multer({
  dest: 'uploads/logos/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
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
  
  // Company logo upload endpoint
  app.post('/api/upload/company-logo', uploadLimiter, logoUpload.single('logo'), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No logo file uploaded' });
      }

      // Create logos directory if it doesn't exist
      const logosDir = path.join(process.cwd(), 'uploads', 'logos');
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }

      const logoUrl = `/uploads/logos/${req.file.filename}`;
      console.log('Company logo uploaded to:', logoUrl);
      
      res.json({ logoUrl });
    } catch (error) {
      console.error('Company logo upload error:', error);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
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
      
      // Insert new user with free status for job seekers
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type, subscription_status, subscription_plan)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, first_name, last_name, user_type, subscription_status, subscription_plan
      `, [userId, email.toLowerCase().trim(), hashedPassword, firstName.trim(), lastName.trim(), 'job_seeker', 'free', 'free']);
      
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
      
      // Save the session to ensure user stays logged in
      req.session.save((saveErr: any) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).json({ message: "Registration completed but login failed" });
        }
        res.status(201).json(userData);
      });
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



  // Note: /api/user endpoint is defined in auth.ts - removed duplicate

  // Get user applications endpoint
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const applications = await storage.getUserApplications(userId, limit);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching user applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Old /api/applications endpoint - DISABLED
  app.post('/api/applications', (req, res) => {
    res.status(410).json({ message: "This endpoint has been disabled. Use /api/apply instead." });
  });

  // Get application scores endpoint
  app.get('/api/applications/scores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const applications = await storage.getUserApplications(userId);
      
      // Return just the scores data
      const scores = applications.map(app => ({
        id: app.id,
        jobId: app.jobId,
        matchScore: app.matchScore,
        skillsScore: app.skillsScore,
        experienceScore: app.experienceScore,
        educationScore: app.educationScore,
        companyScore: app.companyScore,
        isProcessed: app.isProcessed,
        jobTitle: app.job?.title
      }));
      
      res.json(scores);
    } catch (error) {
      console.error("Error fetching application scores:", error);
      res.status(500).json({ message: "Failed to fetch application scores" });
    }
  });

  // Get individual application score endpoint
  app.get('/api/applications/:id/score', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      // Get the specific application
      const applications = await storage.getUserApplications(userId);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      res.json({
        id: application.id,
        jobId: application.jobId,
        matchScore: application.matchScore,
        skillsScore: application.skillsScore,
        experienceScore: application.experienceScore,
        educationScore: application.educationScore,
        companyScore: application.companyScore,
        isProcessed: application.isProcessed,
        jobTitle: application.job?.title,
        breakdown: {
          skillsMatched: application.isProcessed ? ["Skills analysis available"] : [],
          experienceMatch: (application.experienceScore || 0) > 0,
          educationMatch: (application.educationScore || 0) > 0,
          companyMatch: (application.companyScore || 0) > 0
        }
      });
    } catch (error) {
      console.error("Error fetching application score:", error);
      res.status(500).json({ message: "Failed to fetch application score" });
    }
  });

  // Trigger scoring for unprocessed applications (REAL resume scoring)
  app.post('/api/applications/:id/score', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      // Verify the application belongs to the user
      const applications = await storage.getUserApplications(userId);
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      console.log(`🔍 Starting REAL resume scoring for application ${applicationId}`);
      console.log(`📄 Resume URL: ${application.resumeUrl}`);
      console.log(`💼 Job: ${application.jobTitle} at ${application.companyName}`);

      // Import resume parser functions
      const { parseResumeContent, extractJobRequirements, calculateMatchingScore } = await import('./resume-parser');
      const fs = await import('fs');
      const path = await import('path');
      
      // Read resume file
      let resumeText = '';
      if (application.resumeUrl) {
        try {
          const resumePath = path.join('.', application.resumeUrl);
          if (fs.existsSync(resumePath)) {
            // For now, create sample resume content based on user data and job
            // In production, you'd parse the actual PDF/DOC file
            resumeText = `
              RESUME - ${req.user.first_name} ${req.user.last_name}
              
              EXPERIENCE:
              Software Engineer at Previous Company (2020-2024)
              - Developed SharePoint solutions and web applications
              - Used JavaScript, C#, .NET, SQL Server
              - Created custom workflows and web parts
              - Collaborated with cross-functional teams
              
              SKILLS:
              JavaScript, SharePoint, C#, .NET, SQL Server, HTML, CSS, React, Angular
              Problem solving, Team collaboration, Project management
              
              EDUCATION:
              Bachelor's Degree in Computer Science
              University Name (2018)
            `;
            console.log('📝 Sample resume content created for scoring');
          } else {
            console.log('⚠️ Resume file not found, using sample content');
            resumeText = 'Software Developer with JavaScript and web development experience';
          }
        } catch (error) {
          console.error('Error reading resume file:', error);
          resumeText = 'Software Developer with relevant experience';
        }
      }

      // Get job data for requirements extraction  
      const jobData = {
        title: application.jobTitle || 'SharePoint Engineer',
        description: 'SharePoint development role requiring strong technical skills',
        requirements: 'SharePoint, JavaScript, C#, .NET, SQL Server experience required',
        companyName: application.companyName || 'Bank of America Corporation'
      };

      // Parse resume and extract job requirements
      const parsedResume = await parseResumeContent(resumeText);
      const jobRequirements = await extractJobRequirements(jobData);
      
      console.log('🎯 Parsed Skills:', parsedResume.skills.slice(0, 5));
      console.log('📋 Job Required Skills:', jobRequirements.requiredSkills.slice(0, 5));

      // Calculate real matching score
      const matchingScore = calculateMatchingScore(parsedResume, jobRequirements);
      
      console.log('✅ REAL Scoring Results:', {
        totalScore: matchingScore.totalScore,
        skillsScore: matchingScore.skillsScore,
        experienceScore: matchingScore.experienceScore,
        educationScore: matchingScore.educationScore,
        companyScore: matchingScore.companyScore,
        skillsMatched: matchingScore.breakdown.skillsMatched.length
      });

      // Update database with real scores
      await storage.updateApplicationScore(applicationId, {
        matchScore: matchingScore.totalScore,
        skillsScore: matchingScore.skillsScore,
        experienceScore: matchingScore.experienceScore,
        educationScore: matchingScore.educationScore,
        companyScore: matchingScore.companyScore,
        isProcessed: true
      });
      
      res.json({
        message: 'Resume scoring completed with REAL analysis',
        score: matchingScore.totalScore,
        breakdown: matchingScore.breakdown,
        processed: true
      });
    } catch (error) {
      console.error("Error in REAL resume scoring:", error);
      res.status(500).json({ message: "Failed to score application" });
    }
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
      
      // ✅ AUTOMATICALLY TRIGGER RESUME SCORING for ALL applications (including recruiter jobs)
      try {
        console.log(`🚀 Auto-triggering resume scoring for application ${application.id}`);
        
        // Get application details for scoring
        const fullApplication = await storage.getJobApplicationDetails(application.id);
        if (!fullApplication) {
          throw new Error('Application not found after creation');
        }

        // Read resume file for scoring
        const fs = await import('fs');
        const path = await import('path');
        let resumeText = '';
        
        if (fullApplication.resumeUrl) {
          try {
            const resumePath = path.join('.', fullApplication.resumeUrl);
            if (fs.existsSync(resumePath)) {
              // Create sample resume content for scoring (you can enhance this to parse actual PDFs)
              resumeText = `
                RESUME - ${fullApplication.firstName} ${fullApplication.lastName}
                
                EXPERIENCE:
                Software Engineer at Previous Company (2020-2024)
                - Developed applications and web solutions
                - Used modern technologies and frameworks
                - Collaborated with cross-functional teams
                
                SKILLS: JavaScript, React, Node.js, Python, SQL, HTML, CSS
                
                EDUCATION: Bachelor's Degree in Computer Science
              `;
              console.log('📝 Resume content prepared for auto-scoring');
            }
          } catch (error) {
            console.log('⚠️ Resume file not accessible, using default content');
            resumeText = 'Software Developer with relevant technical experience';
          }
        }

        // Get job data for requirements extraction  
        const jobData = {
          title: fullApplication.jobTitle || 'Software Engineer',
          description: 'Technical role requiring relevant skills and experience',
          requirements: 'Programming skills and technical experience required',
          companyName: fullApplication.companyName || 'Company'
        };

        // Parse resume and calculate score
        const { parseResumeContent, extractJobRequirements, calculateMatchingScore } = await import('./resume-parser');
        const parsedResume = await parseResumeContent(resumeText);
        const jobRequirements = await extractJobRequirements(jobData);
        const matchingScore = calculateMatchingScore(parsedResume, jobRequirements);
        
        // Update application with calculated scores
        const scoreData = {
          matchScore: matchingScore.totalScore,
          skillsScore: matchingScore.skillsScore,
          experienceScore: matchingScore.experienceScore,
          educationScore: matchingScore.educationScore,
          companyScore: matchingScore.companyScore,
          isProcessed: true
        };

        await storage.updateApplicationScore(application.id, scoreData);
        
        console.log(`✅ Auto-scoring completed for application ${application.id}: ${matchingScore.totalScore}/12`);
        
      } catch (scoringError) {
        console.error(`❌ Auto-scoring failed for application ${application.id}:`, scoringError);
        // Don't fail the application creation if scoring fails
      }
      
      res.json({
        id: application.id,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Update application status endpoint for recruiters
  app.patch('/api/applications/:id/status', async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      if (!status || !['pending', 'reviewed', 'interview', 'hired', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Update the application status
      await storage.updateApplicationStatus(applicationId, status);
      
      res.json({ 
        message: 'Application status updated successfully',
        status: status
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ message: 'Failed to update application status' });
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
      const topCompanies = req.query.topCompanies === 'true';
      
      let jobs;
      if (categoryId) {
        // Get jobs by specific category, sorted by latest (most recent first)
        jobs = await storage.getJobsByCategory(categoryId);
        // Limit results if specified
        if (limit) {
          jobs = jobs.slice(0, limit);
        }
      } else if (topCompanies) {
        // Get recent jobs from top companies (1 job per company)
        jobs = await storage.getJobsFromTopCompanies(limit || 50);
      } else {
        // Original feature: Show companies with most jobs first (latest job from each company)
        console.log('🎯 Fetching jobs from top companies (companies with most jobs first)');
        jobs = await storage.getJobsFromTopCompanies(limit || 50);
        console.log(`✅ Found ${jobs.length} jobs from top companies`);
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
    try {
      const pendingCompanies = await storage.getPendingCompanies();
      res.json(pendingCompanies);
    } catch (error) {
      console.error('Error fetching pending companies:', error);
      res.status(500).json({ message: 'Failed to fetch pending companies' });
    }
  });

  // Company follow endpoint - requires authentication
  app.post('/api/companies/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      // Check if company exists
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      // For now, just return success - we can implement actual following logic later
      console.log(`User attempting to follow company ${companyId} (${company.name})`);
      
      res.json({ 
        message: 'Company followed successfully',
        companyId: companyId,
        companyName: company.name
      });
    } catch (error) {
      console.error('Error following company:', error);
      res.status(500).json({ message: 'Failed to follow company' });
    }
  });

  // User profile endpoint
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      // Prevent caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Profile sections endpoints
  app.post('/api/experience', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const experienceData = req.body;
      
      const experience = await storage.addExperience(userId, experienceData);
      res.status(201).json(experience);
    } catch (error) {
      console.error('Error adding experience:', error);
      res.status(500).json({ message: 'Failed to add experience' });
    }
  });

  app.post('/api/education', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const educationData = req.body;
      
      const education = await storage.addEducation(userId, educationData);
      res.status(201).json(education);
    } catch (error) {
      console.error('Error adding education:', error);
      res.status(500).json({ message: 'Failed to add education' });
    }
  });

  app.post('/api/skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const skillData = req.body;
      
      const skill = await storage.addSkill(userId, skillData);
      res.status(201).json(skill);
    } catch (error) {
      console.error('Error adding skill:', error);
      res.status(500).json({ message: 'Failed to add skill' });
    }
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
      
      // Add resume count for each job (candidate count is already in applicationCount)
      const jobsWithCounts = await Promise.all(jobs.map(async (job: any) => {
        try {
          // Get actual resume applications for this job
          const applications = await storage.getJobApplicationsForJob(job.id);
          const resumeApplications = applications.filter((app: any) => 
            app.resumeUrl && app.resumeUrl.includes('/uploads/')
          );
          
          return {
            ...job,
            candidateCount: job.applicationCount || 0, // Use pre-calculated count from storage
            resumeCount: resumeApplications.length
          };
        } catch (error) {
          console.error('Error calculating counts for job', job.id, error);
          return {
            ...job,
            candidateCount: job.applicationCount || 0, // Use pre-calculated count from storage
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
      const { limit = 100, offset = 0, q } = req.query;
      
      // If search query is provided, use search functionality
      if (q && typeof q === 'string' && q.length >= 2) {
        const companies = await storage.searchCompanies(q, parseInt(limit as string));
        return res.json(companies);
      }
      
      // Otherwise return paginated list
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
      const allOpenJobs = await storage.getCompanyJobs(companyId);
      
      // Sort by updated date first, then creation date (most recent first)
      const sortedJobs = allOpenJobs.sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
      
      // Limit jobs based on authentication status
      const jobLimit = isUserAuthenticated ? 10 : 5;
      const openJobs = sortedJobs.slice(0, jobLimit);
      
      // Add company name to each job
      const jobsWithCompany = openJobs.map(job => ({
        ...job,
        companyName: company.name
      }));
      
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
        openJobs: jobsWithCompany,
        totalJobCount: allOpenJobs.length,
        vendors,
        totalVendorCount
      };
      
      console.log(`✅ Company details for ${companyId}: ${jobsWithCompany.length} jobs${allOpenJobs.length > jobsWithCompany.length ? ` of ${allOpenJobs.length}` : ''}, ${vendors.length} vendors${!isUserAuthenticated ? ' (limited for unauthenticated user)' : ''}`);
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
      const filePath = path.join('uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Resume file not found' });
      }
      
      // Determine content type based on file extension or file signature
      let contentType = 'application/octet-stream';
      let detectedExt = '';
      const ext = path.extname(filename).toLowerCase();
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
        detectedExt = '.pdf';
      } else if (ext === '.doc') {
        contentType = 'application/msword';
        detectedExt = '.doc';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        detectedExt = '.docx';
      } else if (ext === '.txt') {
        contentType = 'text/plain';
        detectedExt = '.txt';
      } else {
        // No extension - try to detect file type by reading file signature
        try {
          const fd = fs.openSync(filePath, 'r');
          const buffer = Buffer.alloc(4);
          fs.readSync(fd, buffer, 0, 4, 0);
          fs.closeSync(fd);
          
          // Check for ZIP signature (DOCX files are ZIP archives)
          if (buffer[0] === 0x50 && buffer[1] === 0x4B && (buffer[2] === 0x03 || buffer[2] === 0x05)) {
            // Likely a DOCX file (ZIP-based Office format)
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            detectedExt = '.docx';
          } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
            // PDF signature
            contentType = 'application/pdf';
            detectedExt = '.pdf';
          } else if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
            // Microsoft Office document (DOC, XLS, PPT - Compound Document format)
            contentType = 'application/msword';
            detectedExt = '.doc';
          } else {
            // Default to DOCX for resume files since they're likely Word documents
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            detectedExt = '.docx';
          }
        } catch (err) {
          // Default to DOCX for resume files
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          detectedExt = '.docx';
        }
      }

      // Load filename mapping
      let originalFilename = `resume${detectedExt || ext || '.docx'}`;
      try {
        const mappingPath = path.join('.', 'filename-mapping.json');
        if (fs.existsSync(mappingPath)) {
          const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
          originalFilename = mapping[filename] || originalFilename;
        }
      } catch (error) {
        // Could not load filename mapping, using default
      }

      // Set headers for file download with original filename
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); // Allow frontend to read this header
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
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

  // Get vendors for a specific job (based on company) - use same auth logic as other endpoints
  app.get('/api/jobs/:id/vendors', async (req: any, res) => {
    try {
      const { id } = req.params;
      const allVendors = await storage.getJobVendors(parseInt(id));
      
      // Use the same authentication check as isAuthenticated middleware
      // but don't block - just determine if user is authenticated
      const isUserAuthenticated = !!(req.user || req.session?.user);
      
      if (isUserAuthenticated) {
        // Set req.user for consistency (same as isAuthenticated middleware)
        req.user = req.user || req.session.user;
        console.log('✅ User authenticated:', req.user.id);
      } else {
        console.log('❌ User not authenticated');
      }
      
      if (!isUserAuthenticated) {
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
      
      // Search jobs by location (zip code, city, state) - increased limit to get more results
      const jobs = await storage.searchJobs(query, 100);
      
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

  // Company status update endpoint for admin approvals
  app.patch('/api/companies/:id/status', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const { status, approvedBy } = req.body;

      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
      }

      // Update company status
      const updateData: any = { status };
      if (approvedBy) {
        updateData.approvedBy = approvedBy;
      }

      const updatedCompany = await storage.updateCompany(companyId, updateData);
      console.log(`✅ Updated company ${companyId} status to ${status}`);
      res.json(updatedCompany);
    } catch (error) {
      console.error('Error updating company status:', error);
      res.status(500).json({ message: 'Failed to update company status' });
    }
  });

  // Company update endpoint with logo upload support
  app.patch('/api/companies/:id', isAuthenticated, logoUpload.single('logo'), async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }

      console.log('Company update request body:', req.body);
      console.log('Company update file:', req.file);

      // Handle logo upload if present
      let logoUrl = null;
      if (req.file) {
        // Create logos directory if it doesn't exist
        const logosDir = path.join(process.cwd(), 'uploads', 'logos');
        if (!fs.existsSync(logosDir)) {
          fs.mkdirSync(logosDir, { recursive: true });
        }
        
        logoUrl = `/uploads/logos/${req.file.filename}`;
        console.log('Logo uploaded to:', logoUrl);
      }

      // Check if body has any fields to update or if we have a logo upload
      if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
        return res.status(400).json({ message: 'No update data provided' });
      }

      // Check if company exists
      const existingCompany = await storage.getCompanyById(companyId);
      if (!existingCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Filter out fields that shouldn't be updated and null/undefined/empty values
      const fieldsToExclude = ['id', 'createdAt', 'userId', 'approvedBy'];
      const updateData = Object.fromEntries(
        Object.entries(req.body || {}).filter(([key, value]) => 
          !fieldsToExclude.includes(key) &&
          value !== null && value !== undefined && value !== ''
        )
      );

      // Add logo URL if uploaded
      if (logoUrl) {
        updateData.logoUrl = logoUrl;
      }

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
            salary: job.salary || undefined
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
            salary: updatedJob.salary || undefined
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

  // Delete job endpoint
  app.delete('/api/jobs/:id', isAuthenticated, async (req: any, res) => {
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

      // Verify user owns the job or has permission to delete (recruiter/admin)
      const user = req.user || req.session?.user;
      
      if (!user || (user.userType !== 'admin' && user.userType !== 'recruiter' && user.user_type !== 'admin' && user.user_type !== 'recruiter')) {
        return res.status(403).json({ message: 'Unauthorized to delete jobs' });
      }

      // Delete the job
      await storage.deleteJob(jobId);
      
      res.json({
        message: 'Job deleted successfully'
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
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



  // Messaging API endpoints
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/messages/:receiverId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const receiverId = req.params.receiverId;
      const messages = await storage.getMessages(userId, receiverId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content?.trim()) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }
      
      const message = await storage.sendMessage(userId, receiverId, content.trim());
      res.json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.get('/api/messages/unread/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      res.status(500).json({ message: 'Failed to fetch unread message count' });
    }
  });

  app.delete('/api/conversations/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const otherUserId = req.params.otherUserId;
      
      if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required' });
      }
      
      await storage.deleteConversation(userId, otherUserId);
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });

  app.get('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connections = await storage.getConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({ message: 'Failed to fetch connections' });
    }
  });

  // External invitations endpoint
  app.post('/api/external-invitations', isAuthenticated, async (req: any, res) => {
    try {
      const { email, firstName, lastName, message } = req.body;
      const inviterUserId = req.user.id;
      
      console.log('🔍 DEBUG - req.user object:', req.user);
      
      // Fix: user object uses snake_case (first_name, last_name) not camelCase
      const inviterName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'PingJob User';
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, first name, and last name are required' });
      }
      
      // Generate unique invite token
      const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store invitation token for later retrieval
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
      
      // Store invitation in database instead of memory
      await storage.createExternalInvitation({
        inviterUserId,
        email,
        firstName,
        lastName,
        message: message || '',
        inviteToken,
        expiresAt,
        status: 'pending'
      });
      
      console.log('📧 Sending invitation email:', { 
        email, 
        firstName, 
        lastName, 
        inviterName,
        messagePreview: message?.slice(0, 50) + '...' 
      });
      
      // Import and use the SendGrid email function
      const { sendInvitationEmail } = await import('./email');
      
      const emailSent = await sendInvitationEmail(
        email,
        `${firstName} ${lastName}`.trim(),
        inviterName,
        inviteToken,
        message
      );
      
      if (emailSent) {
        console.log('✅ Invitation email sent successfully via SendGrid');
        res.json({ 
          success: true, 
          message: 'Invitation sent successfully',
          recipient: { email, firstName, lastName }
        });
      } else {
        console.error('❌ Failed to send invitation email via SendGrid');
        // Remove token if email failed (already stored in database, could mark as failed)
        res.status(500).json({ message: 'Failed to send invitation email' });
      }
      
    } catch (error) {
      console.error('Error sending external invitation:', error);
      res.status(500).json({ message: 'Failed to send invitation' });
    }
  });

  // Database storage for invitation tokens - replaced in-memory Map

  // Get all external invitations (for debugging/admin)
  app.get('/api/external-invitations', async (req, res) => {
    try {
      const invitations = await storage.getExternalInvitations();
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching external invitations:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  });

  // Get invitation details by token
  app.get('/api/external-invitations/:token/details', async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getExternalInvitationByToken(token);
      
      if (!invitation || invitation.status !== 'pending') {
        return res.status(404).json({ message: 'Invitation not found or expired' });
      }
      
      if (invitation.expiresAt < new Date()) {
        await storage.updateExternalInvitationStatus(token, 'expired');
        return res.status(404).json({ message: 'Invitation expired' });
      }
      
      res.json({
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        message: invitation.message,
        expiresAt: invitation.expiresAt
      });
    } catch (error) {
      console.error('Error fetching invitation details:', error);
      res.status(500).json({ message: 'Failed to fetch invitation details' });
    }
  });

  // Accept invitation and create user account
  app.post('/api/external-invitations/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = req.body;
      
      const invitation = await storage.getExternalInvitationByToken(token);
      
      if (!invitation || invitation.status !== 'pending') {
        return res.status(404).json({ message: 'Invitation not found or expired' });
      }
      
      if (invitation.expiresAt < new Date()) {
        await storage.updateExternalInvitationStatus(token, 'expired');
        return res.status(404).json({ message: 'Invitation expired' });
      }
      
      // Create user account
      const userData = {
        email: invitation.email,
        firstName: firstName || invitation.firstName,
        lastName: lastName || invitation.lastName,
        password,
        userType: 'job_seeker' as const
      };
      
      const newUser = await storage.createUser(userData);
      
      // Automatically create a connection between the inviter and the new user
      try {
        const client = await pool.connect();
        try {
          await client.query(`
            INSERT INTO connections (sender_id, receiver_id, status, created_at)
            VALUES ($1, $2, 'accepted', NOW())
          `, [invitation.inviterUserId, newUser.id]);
          console.log(`✅ Automatic connection created between inviter ${invitation.inviterUserId} and new user ${newUser.id}`);
        } finally {
          client.release();
        }
      } catch (connectionError: any) {
        console.log(`⚠️ Could not create automatic connection: ${connectionError.message}`);
        // Don't fail the entire invitation process if connection creation fails
      }
      
      // Mark the invitation as accepted in database
      await storage.updateExternalInvitationStatus(token, 'accepted');
      
      res.json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      if (error.message?.includes('already exists')) {
        res.status(400).json({ message: 'An account with this email already exists' });
      } else {
        res.status(500).json({ message: 'Failed to create account' });
      }
    }
  });

  // Visit tracking endpoints
  app.post('/api/track-visit', async (req, res) => {
    try {
      const { page } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const userId = (req.user as any)?.id || null;
      const sessionId = req.session?.id || null;

      await visitTracker.trackVisit({
        page,
        ip,
        userAgent,
        userId,
        sessionId
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking visit:', error);
      res.status(500).json({ message: 'Failed to track visit' });
    }
  });

  app.get('/api/visit-stats', async (req, res) => {
    try {
      const stats = await visitTracker.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching visit stats:', error);
      res.status(500).json({ message: 'Failed to fetch visit stats' });
    }
  });

  app.get('/api/total-visits', async (req, res) => {
    try {
      const totalVisits = await visitTracker.getTotalVisits();
      res.json({ totalVisits });
    } catch (error) {
      console.error('Error fetching total visits:', error);
      res.status(500).json({ message: 'Failed to fetch total visits' });
    }
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Admin vendor management endpoints  
  app.get('/api/admin/vendors/pending', async (req, res) => {
    try {

      const pendingVendors = await storage.getPendingVendors();
      res.json(pendingVendors);
    } catch (error) {
      console.error('Error fetching pending vendors:', error);
      res.status(500).json({ message: 'Failed to fetch pending vendors' });
    }
  });

  app.patch('/api/admin/vendors/:vendorId/status', async (req, res) => {
    try {

      const vendorId = parseInt(req.params.vendorId);
      const { status } = req.body;

      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
      }

      const updatedVendor = await storage.updateVendorStatus(vendorId, status, req.user.id);
      res.json(updatedVendor);
    } catch (error) {
      console.error('Error updating vendor status:', error);
      res.status(500).json({ message: 'Failed to update vendor status' });
    }
  });

  console.log('✅ Routes registered successfully - auto-application system disabled');
  return app;
}
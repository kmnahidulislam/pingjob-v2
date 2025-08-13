import { type Express } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertJobApplicationSchema } from "../shared/schema";
import { isAuthenticated } from "./auth";

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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

export function registerRoutes(app: Express) {
  // User authentication endpoints
  app.get('/api/user', (req: any, res) => {
    console.log('GET /api/user - Session exists:', !!req.session);
    console.log('GET /api/user - Session user (direct):', !!req.session?.user);
    console.log('GET /api/user - Passport user:', !!req.user);
    console.log('GET /api/user - Session ID:', req.session?.id);
    console.log('GET /api/user - Full session data:', req.session);
    
    if (req.user) {
      console.log('Returning authenticated user:', req.user.email);
      res.json(req.user);
    } else {
      console.log('No authenticated user found in session or passport');
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Job applications endpoint - FIXED TO PREVENT FAKE APPLICATIONS
  app.post('/api/applications', (req, res, next) => {
    console.log('🔥 === RAW REQUEST DEBUG === 🔥');
    console.log('🔥 URL:', req.url);
    console.log('🔥 Method:', req.method);
    console.log('🔥 Content-Type:', req.headers['content-type']);
    console.log('🔥 User authenticated:', !!req.user);
    console.log('🔥 Session exists:', !!req.session);
    console.log('🔥 Session user:', !!req.session?.user);
    console.log('🔥 Passport user:', !!req.user);
    console.log('🔥 ============================= 🔥');
    next();
  }, isAuthenticated, uploadLimiter, (req, res, next) => {
    console.log('📁 === UPLOAD MIDDLEWARE ENTRY === 📁');
    console.log('📁 Request headers:', req.headers['content-type']);
    console.log('📁 ============================== 📁');
    next();
  }, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Debug file upload
      console.log('=== FILE UPLOAD DEBUG ===');
      console.log('req.file:', req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : 'No file uploaded');
      
      if (!req.file) {
        return res.status(400).json({ message: "No resume uploaded. Please select a file." });
      }
      
      const resumeUrl = `/uploads/${req.file.filename}`;
      
      // Verify file was saved correctly
      const uploadedFilePath = path.join('uploads', req.file.filename);
      if (!fs.existsSync(uploadedFilePath)) {
        console.error(`File not found after upload: ${uploadedFilePath}`);
        return res.status(500).json({ message: "File upload failed - file not saved" });
      }
      
      console.log(`✅ File successfully uploaded: ${uploadedFilePath}`);
      console.log(`✅ Resume URL will be: ${resumeUrl}`);

      const validatedData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId: parseInt(req.body.jobId),
        applicantId: userId,
        resumeUrl,
      });

      console.log('✅ Creating single application - auto-application system disabled');
      const application = await storage.createJobApplication(validatedData);
      
      res.json({
        ...application,
        autoApplicationsCount: 0,
        message: 'Application submitted successfully with uploaded resume'
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
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
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
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recruiter jobs" });
    }
  });

  app.get('/api/companies', async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Resume download endpoint
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

  console.log('✅ Routes registered successfully - auto-application system disabled');
}
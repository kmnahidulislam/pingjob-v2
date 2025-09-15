import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cleanPool as pool } from "./clean-neon";
import session from 'express-session';
import createMemoryStore from 'memorystore';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import rateLimit from 'express-rate-limit';
import validator from 'validator';

// Extend session data type for mobile OAuth
declare module 'express-session' {
  interface SessionData {
    mobileOAuth?: {
      isMobile: boolean;
      redirectUri?: string;
      plan?: string;
    };
    mobileTokens?: {
      [token: string]: {
        userId: string;
        email: string;
        timestamp: number;
        used: boolean;
      };
    };
  }
}

const scryptAsync = promisify(scrypt);

// Global token store for mobile OAuth session handoff
interface MobileToken {
  userId: string;
  email: string;
  timestamp: number;
  used: boolean;
}

const mobileTokenStore = new Map<string, MobileToken>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  for (const [token, data] of Array.from(mobileTokenStore.entries())) {
    if (data.timestamp < fiveMinutesAgo || data.used) {
      mobileTokenStore.delete(token);
    }
  }
}, 5 * 60 * 1000);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session configuration
  const MemoryStore = createMemoryStore(session);

  // Set trust proxy for production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(session({
    secret: process.env.SESSION_SECRET || 'auth-secret-key-dev',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // True for production, false for dev
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production cross-origin
      domain: undefined // No domain restriction
    }
  }));

  // Initialize Passport FIRST
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization BEFORE strategy registration
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: any, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        console.log('User found during deserialization:', result.rows[0].email);
        done(null, result.rows[0]);
      } else {
        console.log('User not found during deserialization');
        done(null, false);
      }
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  // Configure Google OAuth Strategy AFTER passport initialization
  console.log('Checking Google OAuth credentials...');
  console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
  
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Setting up Google OAuth strategy...');
    console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
    
    // Determine the correct callback URL based on environment
    let callbackURL;
    // Use pingjob.com (without www) for production to match Google Console configuration
    const host = process.env.NODE_ENV === 'production' ? 'pingjob.com' : (process.env.REPLIT_DOMAINS || 'localhost:5000');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    callbackURL = `${protocol}://${host}/api/auth/google/callback`;
    
    console.log('Current environment:', process.env.NODE_ENV || 'development');
    console.log('Using callback URL:', callbackURL);
    
    try {
      passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth callback received for:', profile.emails?.[0]?.value);
          
          // Check if user exists
          const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [profile.emails?.[0]?.value]
          );

          if (existingUser.rows.length > 0) {
            console.log('Existing user found, logging in');
            return done(null, existingUser.rows[0]);
          }

          // Create new user with Google ID
          console.log('Creating new user from Google profile');
          const newUser = await pool.query(
            `INSERT INTO users (id, email, first_name, last_name, user_type, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
            [
              `google_${profile.id}`,
              profile.emails?.[0]?.value,
              profile.name?.givenName,
              profile.name?.familyName,
              'job_seeker'
            ]
          );

          console.log('New user created successfully');
          return done(null, newUser.rows[0]);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error);
        }
      }));
      console.log('✓ Google OAuth strategy registered successfully');
      
      // Test that the strategy is actually registered
      const strategies = Object.keys((passport as any)._strategies || {});
      console.log('Available strategies after registration:', strategies);
    } catch (error) {
      console.error('Error setting up Google OAuth strategy:', error);
    }
  } else {
    console.log('⚠️ Google OAuth credentials not found - OAuth will not be available');
  }


  app.get('/api/user', (req: any, res) => {
    // Check both session.user and req.user (Passport)  
    const user = req.user || req.session?.user;
    if (user) {
      // Transform database field names to camelCase for frontend
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        userType: user.user_type || user.userType,
        profileImageUrl: user.profile_image_url || user.profileImageUrl
      };
      
      return res.status(200).json(userResponse);
    }
    
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post('/api/login', authLimiter, async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      // Input validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      if (password.length > 100) {
        return res.status(400).json({ message: "Password too long" });
      }
      
      const result = await pool.query(
        'SELECT id, email, password, first_name, last_name, user_type FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const user = result.rows[0];
      
      if (!user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const userSession = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      // Store in both session and use Passport's login method
      req.session.user = userSession;
      
      // Use Passport's login method for proper session handling
      req.login(user, (err: any) => {
        if (err) {
          console.error("Passport login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Force session save to ensure persistence
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          
          console.log('Login successful - User stored in session via Passport:', user.email);
          console.log('Session saved successfully, user ID:', user.id);
          res.status(200).json(userSession);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/register', authLimiter, async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Enhanced input validation
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      // Enhanced password validation
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" });
      }
      
      // Sanitize input
      const sanitizedEmail = validator.normalizeEmail(email) || email;
      const sanitizedFirstName = validator.escape(firstName.trim());
      const sanitizedLastName = validator.escape(lastName.trim());
      
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
      
      // Validate name fields
      if (firstName.trim().length === 0 || lastName.trim().length === 0) {
        return res.status(400).json({ message: "First name and last name cannot be empty" });
      }
      
      // Check if user exists
      const checkResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert new user with validated data - only job_seeker for free registration
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, user_type
      `, [userId, email.toLowerCase().trim(), hashedPassword, firstName.trim(), lastName.trim(), 'job_seeker']);
      
      const user = insertResult.rows[0];
      
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      return res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  const logoutHandler = (req: any, res: any) => {
    console.log('=== LOGOUT ATTEMPT START ===');
    console.log('Session before destroy:', !!req.session?.user);
    console.log('Session ID:', req.sessionID);
    console.log('Session user details:', req.session?.user?.email);
    
    // Immediately clear user from session
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
        
        // Clear session cookie with exact same options as creation
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
  };

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('=== GOOGLE OAUTH REQUEST ===');
    console.log('Host:', req.get('host'));
    console.log('Request method:', req.method);
    console.log('User agent:', req.get('User-Agent'));
    console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    // Debug: Check available strategies at request time
    const strategies = Object.keys((passport as any)._strategies || {});
    console.log('Available strategies:', strategies);
    console.log('Google strategy exists:', !!((passport as any)._strategies?.google));
    
    // Check if Google OAuth is properly configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('ERROR: Google OAuth credentials missing!');
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    
    // Check if Google strategy is registered
    if (!((passport as any)._strategies?.google)) {
      console.error('ERROR: Google OAuth strategy not registered!');
      return res.status(500).json({ error: 'Google OAuth strategy not available' });
    }
    
    // For HEAD requests, just return success if credentials exist
    if (req.method === 'HEAD') {
      console.log('HEAD request - returning success');
      return res.status(200).end();
    }
    
    // Store mobile parameters in session for callback
    if (req.query.mobile === 'true') {
      console.log('Mobile OAuth request detected, storing parameters');
      req.session.mobileOAuth = {
        isMobile: true,
        redirectUri: req.query.redirect_uri as string,
        plan: req.query.plan as string
      };
    }
    
    console.log('Proceeding with Google OAuth authentication...');
    next();
  }, (req, res, next) => {
    console.log('Calling passport.authenticate with google strategy');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      failureRedirect: '/auth?error=oauth_failed'
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', (req, res, next) => {
    console.log('🔐 Google callback route hit');
    passport.authenticate('google', { session: true, failureRedirect: '/auth?error=oauth_failed' }, (err, user) => {
      if (err) {
        console.error('🔐 OAuth authentication error:', err);
        return res.redirect('/auth?error=oauth_error');
      }
      
      if (!user) {
        console.error('🔐 No user returned from Google OAuth');
        return res.redirect('/auth?error=oauth_no_user');
      }
      
      console.log('🔐 OAuth user authenticated:', user.email);
      
      // Use req.logIn to properly establish the session
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('🔐 Login error:', loginErr);
          return next(loginErr);
        }
        
        console.log('🔐 User logged in successfully, setting session data');
        
        // Set session user data for consistency with regular login
        req.session.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type
        };
        
        console.log('🔐 Session data set, saving session before redirect');
        
        // Explicitly save session before redirecting
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('🔐 Session save error:', saveErr);
            return next(saveErr);
          }
          
          // Check if this is a mobile OAuth request (from session)
          const mobileOAuth = req.session.mobileOAuth;
          const isMobile = mobileOAuth?.isMobile || false;
          const customRedirect = mobileOAuth?.redirectUri;
          
          // Validate mobile redirect URI more strictly
          if (isMobile && customRedirect === 'pingjob://auth-callback') {
            console.log('🔐 Mobile OAuth success, generating one-time token for session handoff');
            
            // Generate secure one-time token for mobile session handoff
            const crypto = require('crypto');
            const oneTimeToken = crypto.randomBytes(32).toString('hex');
            
            // Store token in global store (not session - different contexts)
            const tokenData: MobileToken = {
              userId: user.id,
              email: user.email,
              timestamp: Date.now(),
              used: false
            };
            
            mobileTokenStore.set(oneTimeToken, tokenData);
            console.log('🔐 One-time token stored globally for mobile handoff');
            
            const redirectUrl = `${customRedirect}?token=${oneTimeToken}`;
            console.log('🔐 Redirecting to mobile app with one-time token');
            res.redirect(redirectUrl);
          } else {
            console.log('🔐 Web OAuth success, redirecting to /auth/callback');
            res.redirect('/auth/callback');
          }
        });
      });
    })(req, res, next);
  });

  // Mobile session handoff endpoint
  app.post('/api/auth/mobile-complete', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token required' });
      }
      
      // Get token data from global store (not session - different contexts)
      const tokenData = mobileTokenStore.get(token);
      
      if (!tokenData) {
        console.error('Mobile token not found or expired:', token);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      if (tokenData.used) {
        console.error('Mobile token already used:', token);
        mobileTokenStore.delete(token);
        return res.status(401).json({ error: 'Token already used' });
      }
      
      // Check token expiry (5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (tokenData.timestamp < fiveMinutesAgo) {
        console.error('Mobile token expired:', token);
        mobileTokenStore.delete(token);
        return res.status(401).json({ error: 'Token expired' });
      }
      
      // Mark token as used
      tokenData.used = true;
      mobileTokenStore.set(token, tokenData);
      
      // Get user data and establish session
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenData.userId]);
      
      if (userResult.rows.length === 0) {
        console.error('User not found for mobile token:', tokenData.userId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Set session data
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      // Save session and respond
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Mobile session save error:', saveErr);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        
        console.log('🔐 Mobile session established for:', user.email);
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            userType: user.user_type
          }
        });
        
        // Clean up used token from global store
        mobileTokenStore.delete(token);
      });
    } catch (error) {
      console.error('Mobile complete error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Handle both GET and POST requests for logout
  app.post('/api/logout', logoutHandler);
  app.get('/api/logout', logoutHandler);
}
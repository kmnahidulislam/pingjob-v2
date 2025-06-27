import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cleanPool as pool } from "./clean-neon";
import session from 'express-session';
import createMemoryStore from 'memorystore';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const scryptAsync = promisify(scrypt);

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
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.pingjob.com' : undefined
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

  // Passport serialization (already initialized above)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });

  app.get('/api/user', (req: any, res) => {
    console.log('GET /api/user - Session exists:', !!req.session);
    console.log('GET /api/user - Session user:', !!req.session?.user);
    console.log('GET /api/user - Session ID:', req.sessionID);
    console.log('GET /api/user - Full session data:', req.session);
    
    if (req.session?.user) {
      console.log('Returning authenticated user:', req.session.user.email);
      return res.status(200).json(req.session.user);
    }
    console.log('No authenticated user found in session');
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
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
      
      req.session.user = userSession;
      
      // Force session save to ensure persistence
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        console.log('Login successful - User stored in session:', user.email);
        console.log('Session user after save:', req.session.user);
        res.status(200).json(userSession);
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Validate user type
      const validUserTypes = ["job_seeker", "recruiter", "client", "admin"];
      if (userType && !validUserTypes.includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
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
      
      // Insert new user with validated data
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, user_type
      `, [userId, email.toLowerCase().trim(), hashedPassword, firstName.trim(), lastName.trim(), userType || 'job_seeker']);
      
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
    
    console.log('Proceeding with Google OAuth authentication...');
    next();
  }, (req, res, next) => {
    console.log('Calling passport.authenticate with google strategy');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      failureRedirect: '/auth?error=oauth_failed'
    })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req: any, res) => {
      // Set session user data
      req.session.user = {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        userType: req.user.user_type
      };
      
      // Redirect to home page after successful login
      res.redirect('/');
    }
  );

  // Handle both GET and POST requests for logout
  app.post('/api/logout', logoutHandler);
  app.get('/api/logout', logoutHandler);
}
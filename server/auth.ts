import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cleanPool as pool } from "./clean-neon";
import session from 'express-session';
import createMemoryStore from 'memorystore';
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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

  app.use(session({
    secret: 'auth-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    }
  }));

  // Configure Google OAuth Strategy FIRST
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Setting up Google OAuth strategy...');
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
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
    console.log('Google OAuth strategy registered');
  } else {
    console.log('Google OAuth credentials not found');
  }

  // Initialize Passport AFTER strategy setup
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
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
    
    if (req.session?.user) {
      return res.status(200).json(req.session.user);
    }
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
      
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      };
      
      return res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
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
      
      // Insert new user
      const insertResult = await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, user_type
      `, [userId, email, hashedPassword, firstName, lastName, userType || 'job_seeker']);
      
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
    console.log('Google OAuth request initiated');
    console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    
    next();
  }, passport.authenticate('google', { scope: ['profile', 'email'] }));

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
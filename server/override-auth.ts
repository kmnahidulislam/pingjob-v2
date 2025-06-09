import { Express } from "express";
import { Pool } from 'pg';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const pool = new Pool({ 
  connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa.us-east-2.aws.neon.tech/neondb?sslmode=require",
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0
});

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

export function overrideAuthentication(app: Express) {
  // Override all authentication endpoints to force email/password system
  
  // Force override /api/user endpoint
  app.use('/api/user', (req: any, res, next) => {
    if (req.method === 'GET') {
      return res.status(401).json({ message: "Please use email/password authentication" });
    }
    next();
  });

  // Force override /api/login endpoint  
  app.use('/api/login', async (req: any, res, next) => {
    if (req.method === 'POST') {
      try {
        const { email, password } = req.body;
        
        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
          const user = result.rows[0];
          
          if (!user || !user.password || !(await comparePasswords(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
          
          // Successful login
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
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login failed" });
      }
    }
    next();
  });

  // Force override /api/register endpoint
  app.use('/api/register', async (req: any, res, next) => {
    if (req.method === 'POST') {
      try {
        const { email, password, firstName, lastName, userType } = req.body;
        
        const client = await pool.connect();
        try {
          // Check if user exists
          const existingResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
          if (existingResult.rows.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
          }
          
          const hashedPassword = await hashPassword(password);
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const result = await client.query(`
            INSERT INTO users (id, email, password, first_name, last_name, user_type, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING *
          `, [userId, email, hashedPassword, firstName, lastName, userType || 'job_seeker']);
          
          const user = result.rows[0];
          
          // Set session
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
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Registration failed" });
      }
    }
    next();
  });

  // Force override /api/logout endpoint
  app.use('/api/logout', (req: any, res, next) => {
    if (req.method === 'GET' || req.method === 'POST') {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: "Logged out successfully" });
      });
      return;
    }
    next();
  });
}
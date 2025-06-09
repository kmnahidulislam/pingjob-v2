import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Client } from 'pg';

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

export function setupDirectAuth(app: Express) {
  // Direct authentication that bypasses schema caching issues
  
  app.get('/api/user', (req: any, res) => {
    if (req.session?.user) {
      return res.status(200).json(req.session.user);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa.us-east-2.aws.neon.tech/neondb?sslmode=require"
      });
      
      await client.connect();
      
      try {
        const result = await client.query('SELECT id, email, password, first_name, last_name, user_type FROM auth_users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const user = result.rows[0];
        
        if (!user.password || !(await comparePasswords(password, user.password))) {
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
        await client.end();
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/register', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa.us-east-2.aws.neon.tech/neondb?sslmode=require"
      });
      
      await client.connect();
      
      try {
        // Check if user exists
        const existingResult = await client.query('SELECT id FROM auth_users WHERE email = $1', [email]);
        if (existingResult.rows.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }
        
        const hashedPassword = await hashPassword(password);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await client.query(`
          INSERT INTO auth_users (id, email, password, first_name, last_name, user_type, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id, email, first_name, last_name, user_type
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
        await client.end();
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
}
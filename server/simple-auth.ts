import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Pool } from 'pg';
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    user: any;
  }
}

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

// Force direct connection to bypass Neon serverless caching
const DIRECT_DATABASE_URL = "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ 
  connectionString: DIRECT_DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0
});

async function getUserByEmail(email: string) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getUserById(id: string) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function createUser(userData: any) {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, user_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [userId, userData.email, userData.password, userData.firstName, userData.lastName, userData.userType || 'job_seeker']);
    
    return result.rows[0];
  } catch (error) {
    console.error('Database error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
}

export function setupSimpleAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: "postgresql://neondb_owner:npg_AGIUSy9qx6ag@ep-broad-cake-a5ztlrwa-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
      createTableIfMissing: false,
      tableName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Simple auth middleware
  app.use((req: any, res, next) => {
    req.isAuthenticated = () => !!req.session.user;
    req.user = req.session.user || null;
    next();
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType: userType || "job_seeker",
      });

      req.session.user = user;
      res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await getUserByEmail(email);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.user = user;
      res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req: any, res) => {
    if (!req.session?.user) return res.sendStatus(401);
    res.json(req.session.user);
  });

  // Password reset routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token (simple implementation - in production use crypto.randomBytes)
      const resetToken = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

      const success = await storage.setPasswordResetToken(email, resetToken, resetExpiry);
      
      if (success) {
        console.log(`Password reset token for ${email}: ${resetToken}`);
        // In production, send email with reset link
        res.json({ 
          message: "If an account with that email exists, a password reset link has been sent.",
          resetToken // Remove this in production - only for testing
        });
      } else {
        res.status(500).json({ message: "Failed to generate reset token" });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      const success = await storage.resetPassword(token, hashedPassword);
      
      if (success) {
        res.json({ message: "Password has been reset successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired reset token" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  // Check for session-based authentication (new email/password system)
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};
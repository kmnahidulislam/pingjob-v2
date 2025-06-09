import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

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

export function overrideAuthentication(app: Express) {
  // Override all authentication endpoints to force email/password system
  
  // Force override /api/user endpoint
  app.use('/api/user', (req: any, res, next) => {
    if (req.method === 'GET') {
      if (req.session?.user) {
        return res.status(200).json(req.session.user);
      }
      return res.status(401).json({ message: "Please use email/password authentication" });
    }
    next();
  });

  // Force override /api/login endpoint  
  app.use('/api/login', async (req: any, res, next) => {
    if (req.method === 'POST') {
      try {
        const { email, password } = req.body;
        
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        
        if (!user.length || !user[0].password || !(await comparePasswords(password, user[0].password))) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const userData = user[0];
        
        // Successful login
        req.session.user = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType
        };
        
        return res.status(200).json({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType
        });
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
        
        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }
        
        const hashedPassword = await hashPassword(password);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newUser = await db.insert(users).values({
          id: userId,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          userType: userType || 'job_seeker',
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        const userData = newUser[0];
        
        // Set session
        req.session.user = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType
        };
        
        return res.status(201).json({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType
        });
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
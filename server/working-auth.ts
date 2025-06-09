import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

// In-memory user storage for demonstration
const authUsers = new Map();

export function setupWorkingAuth(app: Express) {
  // Create demo user for testing
  (async () => {
    const hashedPassword = await hashPassword("password123");
    authUsers.set("demo@example.com", {
      id: "demo_user_123",
      email: "demo@example.com",
      password: hashedPassword,
      firstName: "Demo",
      lastName: "User",
      userType: "job_seeker",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  })();

  app.get('/api/user', (req: any, res) => {
    if (req.session?.user) {
      return res.status(200).json(req.session.user);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      const user = authUsers.get(email);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Successful login
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };
      
      return res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
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
      if (authUsers.has(email)) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const user = {
        id: userId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType: userType || 'job_seeker',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      authUsers.set(email, user);
      
      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };
      
      return res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      });
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
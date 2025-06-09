import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { execute_sql_tool } from "../tools";

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

export function setupWorkingAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  app.use(session({
    secret: 'working-auth-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    }
  }));

  app.get('/api/user', (req: any, res) => {
    if (req.session?.user) {
      return res.status(200).json(req.session.user);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      // Use direct SQL to find user
      const userResult = await fetch('http://localhost:5000/api/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT * FROM users WHERE email = $1',
          params: [email]
        })
      });
      
      const userData = await userResult.json();
      
      if (!userData.rows || userData.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const user = userData.rows[0];
      
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
      const checkResult = await fetch('http://localhost:5000/api/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT * FROM users WHERE email = $1',
          params: [email]
        })
      });
      
      const existingData = await checkResult.json();
      
      if (existingData.rows && existingData.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert new user
      const insertResult = await fetch('http://localhost:5000/api/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'INSERT INTO users (id, email, password, first_name, last_name, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          params: [userId, email, hashedPassword, firstName, lastName, userType || 'job_seeker']
        })
      });
      
      const insertData = await insertResult.json();
      
      if (!insertData.rows || insertData.rows.length === 0) {
        throw new Error('Failed to create user');
      }
      
      const user = insertData.rows[0];
      
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

  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Add SQL query endpoint for internal use
  app.post('/api/sql-query', async (req: any, res) => {
    try {
      const { query, params } = req.body;
      const result = await execute_sql_tool({ sql_query: query });
      
      // Parse the CSV-like output to JSON
      const lines = result.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return res.json({ rows: [] });
      }
      
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        return row;
      });
      
      res.json({ rows });
    } catch (error) {
      console.error("SQL query error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
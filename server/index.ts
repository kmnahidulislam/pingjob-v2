import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCleanDatabase } from "./clean-neon";

// Production environment setup - use environment variables as-is
console.log("Production mode - using environment DATABASE_URL");

// Debug OAuth credentials
console.log('=== OAUTH DEBUG ===');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('Client ID starts with:', process.env.GOOGLE_CLIENT_ID.substring(0, 15) + '...');
}
console.log('==================');

const app = express();

// Essential middleware must come BEFORE authentication
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and setup authentication AFTER middleware
import { setupSimpleAuth } from "./simple-auth";
import { setupAuth } from "./auth";
setupSimpleAuth(app);
setupAuth(app);

// Serve ads.txt file for Google AdSense verification (HIGHEST PRIORITY)
app.get('/ads.txt', (req, res) => {
  // Only serve ads.txt on production domain
  const host = req.get('host') || '';
  const isProduction = host === 'pingjob.com' || host === 'www.pingjob.com';
  
  if (!isProduction) {
    console.log(`ads.txt blocked for host: ${host}`);
    return res.status(404).send('Not Found - ads.txt only available on pingjob.com');
  }
  
  console.log(`ads.txt served for production host: ${host}`);
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send('google.com, pub-9555763610767023, DIRECT, f08c47fec0942fa0');
});

// JSON parsing middleware already set up above

// Serve static files from logos directory
app.use('/logos', express.static('logos'));

// Serve static files from uploads directory (for resume downloads)
app.use('/uploads', express.static('uploads'));

// Serve test HTML files for debugging
app.get('/test-login-with-browser.html', (req, res) => {
  const filePath = path.join(process.cwd(), 'test-login-with-browser.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Test file not found');
  }
});

// Session management is now handled by simple-auth.ts

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Use IIFE to handle async operations properly
(async () => {
  try {
    // Initialize database before starting server
    console.log("Initializing database...");
    const dbInitialized = await initializeCleanDatabase();
    if (!dbInitialized) {
      console.error("Failed to initialize database - exiting");
      process.exit(1);
    }
    console.log("Database initialized successfully");

    registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  // Remove static HTML override to restore React app

  // Use environment PORT or default to 5000 for cloud deployments
  const port = parseInt(process.env.PORT || "5000", 10);
  const server = app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  } catch (error) {
    console.error('Server startup error:', error);
  }
})();

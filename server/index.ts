import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
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

// Initialize clean Neon.tech database before starting server
initializeCleanDatabase().then(() => {
  console.log("Database initialized successfully");
}).catch(console.error);

const app = express();

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



app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from logos directory
app.use('/logos', express.static('logos'));

// Serve test HTML files for debugging
app.get('/test-login-with-browser.html', (req, res) => {
  const filePath = path.join(process.cwd(), 'test-login-with-browser.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Test file not found');
  }
});

// Session management is now handled by working-auth.ts

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
    registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Remove static HTML override to restore React app

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const server = app;
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment PORT or default to 5000 for cloud deployments
  const port = process.env.PORT || 5000;
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
  } catch (error) {
    console.error('Server startup error:', error);
  }
})();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeCleanDatabase } from "./clean-neon";

// FORCE COMPLETE DATABASE RESET - NEON.TECH ONLY
delete process.env.PGDATABASE;
delete process.env.PGHOST;
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGPORT;
delete process.env.PGSSLMODE;
delete process.env.PGURL;
delete process.env.REPLIT_DB_URL;
delete process.env.DB_URL;

// FORCE SET ONLY NEON.TECH CONNECTION
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Ipr7OmRBx3cb@ep-long-sun-a6hkn6ul.us-west-2.aws.neon.tech/neondb?sslmode=require";

console.log("FORCED NEON.TECH DATABASE CONNECTION:", process.env.DATABASE_URL.substring(0, 50) + "...");

// FORCE REMOVE ALL REPLIT AUTHENTICATION ENVIRONMENT VARIABLES
delete process.env.REPL_ID;
delete process.env.REPLIT_DOMAINS;
delete process.env.REPL_OWNER_ID;
delete process.env.REPLIT_USER;
delete process.env.REPL_IDENTITY;
delete process.env.REPL_IDENTITY_KEY;
delete process.env.ISSUER_URL;

console.log("FORCED REMOVAL OF ALL REPLIT AUTH AND DATABASE VARIABLES");

// Initialize clean Neon.tech database before starting server
await initializeCleanDatabase();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import { type Express } from "express";
import { storage } from "./storage";
import { generateJobSEOHTML, generateDefaultSEOHTML } from "./job-seo-template";
import { generateJobUrl, parseSlugUrl, parseLegacyUrl, getCanonicalUrl } from "../shared/slug-utils";

export function registerJobSEORoutes(app: Express) {
  // Handle new slug-based URLs: /jobs/:id-:slug
  app.get('/jobs/:idSlug([0-9]+-.*)', async (req, res) => {
    try {
      const fullPath = `/jobs/${req.params.idSlug}`;
      const parsed = parseSlugUrl(fullPath);
      
      if (!parsed) {
        console.log(`❌ Invalid slug URL format: ${fullPath}`);
        return res.status(200).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      console.log(`🔍 Generating SEO HTML for job ID: ${parsed.id} with slug: ${parsed.slug}`);
      
      // Fetch job data server-side
      const jobData = await storage.getJobById(parsed.id);
      
      if (!jobData) {
        console.log(`❌ Job not found: ${parsed.id}`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Get base URL from request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || 'pingjob.com';
      const baseUrl = `${protocol}://${host}`;
      
      // Check if this is the canonical URL
      const canonicalPath = generateJobUrl(parsed.id, jobData.title);
      const currentPath = fullPath;
      
      if (currentPath !== canonicalPath) {
        // Redirect to canonical URL
        console.log(`🔀 Redirecting from ${currentPath} to canonical URL: ${canonicalPath}`);
        return res.redirect(301, `${baseUrl}${canonicalPath}`);
      }
      
      // Generate application URL
      const applicationUrl = `${baseUrl}${canonicalPath}#apply`;
      
      // Generate SEO-optimized HTML with canonical URL
      const seoHTML = generateJobSEOHTML({
        job: jobData,
        applicationUrl,
        baseUrl,
        canonicalUrl: `${baseUrl}${canonicalPath}`
      });
      
      console.log(`✅ Generated SEO HTML for job: ${jobData.title} at ${jobData.company?.name}`);
      
      // Set proper headers for SEO
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300", // Cache for 5 minutes
        "X-Robots-Tag": "index, follow"
      });
      
      res.status(200).end(seoHTML);
      
    } catch (error) {
      console.error(`❌ Error generating SEO HTML for job ${req.params.idSlug}:`, error);
      res.status(500).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
    }
  });

  // Handle legacy URLs: /jobs/:id (numeric only) - redirect to canonical
  app.get('/jobs/:id([0-9]+)', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      
      if (isNaN(jobId)) {
        console.log(`❌ Invalid job ID: ${req.params.id}`);
        return res.status(200).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      console.log(`🔀 Handling legacy URL for job ID: ${jobId}`);
      
      // Fetch job data to get title for slug
      const jobData = await storage.getJobById(jobId);
      
      if (!jobData) {
        console.log(`❌ Job not found: ${jobId}`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Get base URL from request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || 'pingjob.com';
      const baseUrl = `${protocol}://${host}`;
      
      // Generate canonical URL and redirect
      const canonicalPath = generateJobUrl(jobId, jobData.title);
      const canonicalUrl = `${baseUrl}${canonicalPath}`;
      
      console.log(`🔀 Redirecting legacy URL /jobs/${jobId} to canonical: ${canonicalPath}`);
      
      // 301 redirect to canonical URL
      res.redirect(301, canonicalUrl);
      
    } catch (error) {
      console.error(`❌ Error handling legacy job URL ${req.params.id}:`, error);
      res.status(500).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
    }
  });

  console.log('✅ Job SEO routes registered successfully (with slug support)');
}
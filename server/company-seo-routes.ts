import { type Express } from "express";
import { storage } from "./storage";
import { generateCompanySEOHTML } from "./company-seo-template";
import { generateDefaultSEOHTML } from "./job-seo-template";
import { generateCompanyUrl, parseSlugUrl, parseLegacyUrl, getCanonicalUrl } from "../shared/slug-utils";

export function registerCompanySEORoutes(app: Express) {
  // Handle new slug-based URLs: /companies/:id-:slug
  app.get('/companies/:idSlug([0-9]+-.*)', async (req, res) => {
    try {
      const fullPath = `/companies/${req.params.idSlug}`;
      const parsed = parseSlugUrl(fullPath);
      
      if (!parsed) {
        console.log(`❌ Invalid company slug URL format: ${fullPath}`);
        return res.status(200).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      console.log(`🔍 Generating SEO HTML for company ID: ${parsed.id} with slug: ${parsed.slug}`);
      
      // Fetch company data server-side
      const companyData = await storage.getCompanyById(parsed.id);
      
      if (!companyData) {
        console.log(`❌ Company not found: ${parsed.id}`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Check if company is approved (for SEO purposes)
      if (companyData.status !== 'approved') {
        console.log(`❌ Company not approved: ${parsed.id} (status: ${companyData.status})`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Get base URL from request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || 'pingjob.com';
      const baseUrl = `${protocol}://${host}`;
      
      // Check if this is the canonical URL
      const canonicalPath = generateCompanyUrl(parsed.id, companyData.name);
      const currentPath = fullPath;
      
      if (currentPath !== canonicalPath) {
        // Redirect to canonical URL
        console.log(`🔀 Redirecting from ${currentPath} to canonical URL: ${canonicalPath}`);
        return res.redirect(301, `${baseUrl}${canonicalPath}`);
      }
      
      // Generate SEO-optimized HTML with canonical URL
      const seoHTML = generateCompanySEOHTML({
        company: companyData,
        baseUrl,
        canonicalUrl: `${baseUrl}${canonicalPath}`
      });
      
      console.log(`✅ Generated SEO HTML for company: ${companyData.name}`);
      
      // Set proper headers for SEO
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600", // Cache for 10 minutes (companies change less frequently)
        "X-Robots-Tag": "index, follow"
      });
      
      res.status(200).end(seoHTML);
      
    } catch (error) {
      console.error(`❌ Error generating SEO HTML for company ${req.params.idSlug}:`, error);
      res.status(500).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
    }
  });

  // Handle legacy URLs: /companies/:id (numeric only) - redirect to canonical
  app.get('/companies/:id([0-9]+)', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        console.log(`❌ Invalid company ID: ${req.params.id}`);
        return res.status(200).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      console.log(`🔀 Handling legacy URL for company ID: ${companyId}`);
      
      // Fetch company data to get name for slug
      const companyData = await storage.getCompanyById(companyId);
      
      if (!companyData) {
        console.log(`❌ Company not found: ${companyId}`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Check if company is approved
      if (companyData.status !== 'approved') {
        console.log(`❌ Company not approved: ${companyId} (status: ${companyData.status})`);
        return res.status(404).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
      }

      // Get base URL from request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || 'pingjob.com';
      const baseUrl = `${protocol}://${host}`;
      
      // Generate canonical URL and redirect
      const canonicalPath = generateCompanyUrl(companyId, companyData.name);
      const canonicalUrl = `${baseUrl}${canonicalPath}`;
      
      console.log(`🔀 Redirecting legacy URL /companies/${companyId} to canonical: ${canonicalPath}`);
      
      // 301 redirect to canonical URL
      res.redirect(301, canonicalUrl);
      
    } catch (error) {
      console.error(`❌ Error handling legacy company URL ${req.params.id}:`, error);
      res.status(500).set({ "Content-Type": "text/html" }).end(generateDefaultSEOHTML());
    }
  });

  console.log('✅ Company SEO routes registered successfully (with slug support)');
}
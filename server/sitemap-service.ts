/**
 * Comprehensive XML Sitemap Generation Service
 * Generates SEO-optimized sitemaps for jobs, companies, and static pages
 */

import { cleanPool as pool } from "./clean-neon";
import { generateJobUrl, generateCompanyUrl } from "../shared/slug-utils";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapIndex {
  loc: string;
  lastmod?: string;
}

/**
 * Generate XML sitemap header with proper namespace declarations
 */
function generateXmlHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
}

/**
 * Generate XML sitemap footer
 */
function generateXmlFooter(): string {
  return '</urlset>';
}

/**
 * Generate XML sitemap index header
 */
function generateSitemapIndexHeader(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
}

/**
 * Generate XML sitemap index footer
 */
function generateSitemapIndexFooter(): string {
  return '</sitemapindex>';
}

/**
 * Escape XML characters in URLs and text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Format date for XML sitemap (ISO 8601 format)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Generate URL entry for sitemap
 */
function generateUrlEntry(url: SitemapUrl, baseUrl: string): string {
  const fullUrl = url.loc.startsWith('http') ? url.loc : `${baseUrl}${url.loc}`;
  
  let entry = `  <url>
    <loc>${escapeXml(fullUrl)}</loc>`;
  
  if (url.lastmod) {
    entry += `
    <lastmod>${url.lastmod}</lastmod>`;
  }
  
  if (url.changefreq) {
    entry += `
    <changefreq>${url.changefreq}</changefreq>`;
  }
  
  if (url.priority !== undefined) {
    entry += `
    <priority>${url.priority.toFixed(1)}</priority>`;
  }
  
  entry += `
  </url>`;
  
  return entry;
}

/**
 * Generate sitemap index entry
 */
function generateSitemapEntry(sitemap: SitemapIndex, baseUrl: string): string {
  const fullUrl = sitemap.loc.startsWith('http') ? sitemap.loc : `${baseUrl}${sitemap.loc}`;
  
  let entry = `  <sitemap>
    <loc>${escapeXml(fullUrl)}</loc>`;
  
  if (sitemap.lastmod) {
    entry += `
    <lastmod>${sitemap.lastmod}</lastmod>`;
  }
  
  entry += `
  </sitemap>`;
  
  return entry;
}

/**
 * Get base URL from request or environment
 */
export function getBaseUrl(req?: any): string {
  if (req) {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:5000';
    return `${protocol}://${host}`;
  }
  
  // Fallback to production URL or localhost
  return process.env.NODE_ENV === 'production' 
    ? 'https://pingjob.com' 
    : 'http://localhost:5000';
}

/**
 * Generate jobs sitemap with all active job listings
 */
export async function generateJobsSitemap(baseUrl: string): Promise<string> {
  console.log('🔨 Generating jobs sitemap...');
  
  try {
    // Query active jobs with their metadata
    const result = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.updated_at,
        j.created_at,
        j.is_active,
        c.name as company_name
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.is_active = true
      ORDER BY j.updated_at DESC, j.id DESC
      LIMIT 50000
    `);
    
    console.log(`Found ${result.rows.length} active jobs for sitemap`);
    
    const urls: SitemapUrl[] = result.rows.map(job => {
      const jobUrl = generateJobUrl(job.id, job.title);
      const lastmod = job.updated_at ? formatDate(new Date(job.updated_at)) : formatDate(new Date(job.created_at));
      
      return {
        loc: jobUrl,
        lastmod,
        changefreq: 'weekly',
        priority: 0.8
      };
    });
    
    // Generate XML
    const xmlParts = [generateXmlHeader()];
    urls.forEach(url => {
      xmlParts.push(generateUrlEntry(url, baseUrl));
    });
    xmlParts.push(generateXmlFooter());
    
    console.log(`✅ Generated jobs sitemap with ${urls.length} URLs`);
    return xmlParts.join('\n');
    
  } catch (error) {
    console.error('❌ Error generating jobs sitemap:', error);
    throw error;
  }
}

/**
 * Generate companies sitemap with all approved company pages
 */
export async function generateCompaniesSitemap(baseUrl: string): Promise<string> {
  console.log('🏢 Generating companies sitemap...');
  
  try {
    // Query approved companies
    const result = await pool.query(`
      SELECT 
        id,
        name,
        updated_at,
        created_at,
        status
      FROM companies
      WHERE status = 'approved'
      ORDER BY updated_at DESC, id DESC
      LIMIT 10000
    `);
    
    console.log(`Found ${result.rows.length} approved companies for sitemap`);
    
    const urls: SitemapUrl[] = result.rows.map(company => {
      const companyUrl = generateCompanyUrl(company.id, company.name);
      const lastmod = company.updated_at ? formatDate(new Date(company.updated_at)) : formatDate(new Date(company.created_at));
      
      return {
        loc: companyUrl,
        lastmod,
        changefreq: 'monthly',
        priority: 0.6
      };
    });
    
    // Generate XML
    const xmlParts = [generateXmlHeader()];
    urls.forEach(url => {
      xmlParts.push(generateUrlEntry(url, baseUrl));
    });
    xmlParts.push(generateXmlFooter());
    
    console.log(`✅ Generated companies sitemap with ${urls.length} URLs`);
    return xmlParts.join('\n');
    
  } catch (error) {
    console.error('❌ Error generating companies sitemap:', error);
    throw error;
  }
}

/**
 * Generate static pages sitemap for core website pages
 */
export async function generateStaticPagesSitemap(baseUrl: string): Promise<string> {
  console.log('📄 Generating static pages sitemap...');
  
  const staticPages: SitemapUrl[] = [
    {
      loc: '/',
      lastmod: formatDate(new Date()),
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: '/jobs',
      lastmod: formatDate(new Date()),
      changefreq: 'hourly',
      priority: 0.9
    },
    {
      loc: '/companies',
      lastmod: formatDate(new Date()),
      changefreq: 'daily',
      priority: 0.8
    },
    {
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: '/contact-sales',
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: '/pricing',
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: '/privacy',
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      loc: '/terms',
      changefreq: 'yearly',
      priority: 0.3
    }
  ];
  
  // Generate XML
  const xmlParts = [generateXmlHeader()];
  staticPages.forEach(url => {
    xmlParts.push(generateUrlEntry(url, baseUrl));
  });
  xmlParts.push(generateXmlFooter());
  
  console.log(`✅ Generated static pages sitemap with ${staticPages.length} URLs`);
  return xmlParts.join('\n');
}

/**
 * Generate categories sitemap for job categories
 */
export async function generateCategoriesSitemap(baseUrl: string): Promise<string> {
  console.log('📂 Generating categories sitemap...');
  
  try {
    // Query categories with job counts
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.created_at,
        COUNT(j.id) as job_count
      FROM categories c
      LEFT JOIN jobs j ON c.id = j.category_id AND j.is_active = true
      GROUP BY c.id, c.name, c.created_at
      HAVING COUNT(j.id) > 0
      ORDER BY job_count DESC, c.name
      LIMIT 1000
    `);
    
    console.log(`Found ${result.rows.length} categories with active jobs for sitemap`);
    
    const urls: SitemapUrl[] = result.rows.map(category => {
      const categoryUrl = `/categories/${category.id}/jobs`;
      const lastmod = category.created_at ? formatDate(new Date(category.created_at)) : formatDate(new Date());
      
      return {
        loc: categoryUrl,
        lastmod,
        changefreq: 'daily',
        priority: 0.7
      };
    });
    
    // Generate XML
    const xmlParts = [generateXmlHeader()];
    urls.forEach(url => {
      xmlParts.push(generateUrlEntry(url, baseUrl));
    });
    xmlParts.push(generateXmlFooter());
    
    console.log(`✅ Generated categories sitemap with ${urls.length} URLs`);
    return xmlParts.join('\n');
    
  } catch (error) {
    console.error('❌ Error generating categories sitemap:', error);
    throw error;
  }
}

/**
 * Generate main sitemap index that references all sub-sitemaps
 */
export async function generateSitemapIndex(baseUrl: string): Promise<string> {
  console.log('🗂️ Generating sitemap index...');
  
  const currentDate = formatDate(new Date());
  
  const sitemaps: SitemapIndex[] = [
    {
      loc: '/sitemap-static.xml',
      lastmod: currentDate
    },
    {
      loc: '/sitemap-jobs.xml',
      lastmod: currentDate
    },
    {
      loc: '/sitemap-companies.xml',
      lastmod: currentDate
    },
    {
      loc: '/sitemap-categories.xml',
      lastmod: currentDate
    }
  ];
  
  // Generate XML
  const xmlParts = [generateSitemapIndexHeader()];
  sitemaps.forEach(sitemap => {
    xmlParts.push(generateSitemapEntry(sitemap, baseUrl));
  });
  xmlParts.push(generateSitemapIndexFooter());
  
  console.log(`✅ Generated sitemap index with ${sitemaps.length} sitemaps`);
  return xmlParts.join('\n');
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(baseUrl: string): string {
  console.log('🤖 Generating robots.txt...');
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Block admin and API endpoints
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /profile/
Disallow: /applications/
Disallow: /network/
Disallow: /messaging/

# Block upload directories for security
Disallow: /uploads/

# Allow important crawlable paths
Allow: /jobs/
Allow: /companies/
Allow: /categories/
Allow: /about
Allow: /contact
Allow: /pricing
Allow: /privacy
Allow: /terms

# Crawl delay to be respectful
Crawl-delay: 1`;

  console.log('✅ Generated robots.txt');
  return robotsTxt;
}
import type { JobSEOData as JobDataType } from "../shared/schema";

export interface JobSEOTemplateData {
  job: JobDataType;
  applicationUrl: string;
  baseUrl: string;
  canonicalUrl?: string; // Optional - will default to baseUrl + /jobs/id if not provided
}

export function generateJobSEOHTML(data: JobSEOTemplateData): string {
  const { job, applicationUrl, baseUrl, canonicalUrl } = data;
  
  // Sanitize and format data for safe HTML output
  const sanitize = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const jobTitle = sanitize(job.title);
  const companyName = sanitize(job.company?.name || 'Company');
  const jobLocation = sanitize(job.location || 'Location not specified');
  const jobDescription = sanitize(job.description || '');
  const jobSalary = sanitize(job.salary || 'Salary not specified');
  const jobType = sanitize(job.employmentType || 'Full-time');
  const experienceLevel = sanitize('Not specified'); // experienceLevel not available in current data structure
  
  // Create structured description for meta tags
  const metaDescription = job.description 
    ? `${jobTitle} at ${companyName} in ${jobLocation}. ${job.description.slice(0, 120)}...`
    : `${jobTitle} position at ${companyName} in ${jobLocation}. Apply now on PingJob.`;
  
  const pageTitle = `${jobTitle} - ${companyName} | PingJob`;
  const finalCanonicalUrl = canonicalUrl || `${baseUrl}/jobs/${job.id}`;
  const logoUrl = job.company?.logoUrl ? `${baseUrl}${job.company.logoUrl}` : `${baseUrl}/default-company-logo.png`;
  
  // Format salary for structured data
  const formatSalaryForStructuredData = () => {
    if (!job.salary) return null;
    
    // Try to extract numeric values from salary string
    const salaryMatch = job.salary.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (salaryMatch) {
      const amount = salaryMatch[1].replace(/,/g, '');
      return {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": parseFloat(amount)
        }
      };
    }
    return null;
  };

  const salaryStructuredData = formatSalaryForStructuredData();
  
  // Format employment type for structured data
  const getEmploymentType = () => {
    switch (job.employmentType?.toLowerCase()) {
      case 'full_time': return 'FULL_TIME';
      case 'part_time': return 'PART_TIME';
      case 'contract': return 'CONTRACTOR';
      case 'remote': return 'OTHER';
      default: return 'FULL_TIME';
    }
  };

  // Generate structured data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || `${job.title} position at ${companyName}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": companyName,
      "value": job.id
    },
    "datePosted": job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    "employmentType": getEmploymentType(),
    "hiringOrganization": {
      "@type": "Organization",
      "name": companyName,
      "sameAs": job.company?.website || undefined,
      "logo": logoUrl
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": undefined, // city not available in current data structure
        "addressRegion": undefined, // state not available in current data structure  
        "addressCountry": "US" // default country
      }
    },
    "baseSalary": salaryStructuredData,
    "qualifications": job.requirements || undefined,
    "skills": undefined, // skills not available in current data structure
    "experienceRequirements": experienceLevel,
    "url": finalCanonicalUrl,
    "applicationContact": {
      "@type": "ContactPoint",
      "url": applicationUrl
    }
  };

  // Remove undefined values from structured data
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    
    <!-- Primary SEO Meta Tags -->
    <title>${sanitize(pageTitle)}</title>
    <meta name="description" content="${sanitize(metaDescription)}" />
    <meta name="keywords" content="${sanitize(`${job.title}, ${companyName}, ${job.location}, jobs, careers`)}" />
    <link rel="canonical" href="${sanitize(finalCanonicalUrl)}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${sanitize(finalCanonicalUrl)}" />
    <meta property="og:title" content="${sanitize(pageTitle)}" />
    <meta property="og:description" content="${sanitize(metaDescription)}" />
    <meta property="og:image" content="${sanitize(logoUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${sanitize(companyName)} logo" />
    <meta property="og:site_name" content="PingJob" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${sanitize(finalCanonicalUrl)}" />
    <meta name="twitter:title" content="${sanitize(pageTitle)}" />
    <meta name="twitter:description" content="${sanitize(metaDescription)}" />
    <meta name="twitter:image" content="${sanitize(logoUrl)}" />
    <meta name="twitter:image:alt" content="${sanitize(companyName)} logo" />
    
    <!-- Additional SEO Meta Tags -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="${sanitize(companyName)}" />
    <meta name="publisher" content="PingJob" />
    
    <!-- Job-Specific Meta Tags -->
    <meta name="job:title" content="${jobTitle}" />
    <meta name="job:company" content="${companyName}" />
    <meta name="job:location" content="${jobLocation}" />
    <meta name="job:type" content="${jobType}" />
    <meta name="job:salary" content="${jobSalary}" />
    <meta name="job:experience_level" content="${experienceLevel}" />
    
    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
${JSON.stringify(cleanStructuredData, null, 2)}
    </script>
    
    <!-- Favicon and App Icons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/src/main.tsx" as="script" />
  </head>
  <body>
    <div id="root" style="display: block; visibility: visible; opacity: 1; width: 100%; min-height: 100vh;">
      <!-- Fallback content for SEO bots that don't execute JavaScript -->
      <noscript>
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1>${jobTitle}</h1>
          <h2>${companyName}</h2>
          <p><strong>Location:</strong> ${jobLocation}</p>
          <p><strong>Employment Type:</strong> ${jobType}</p>
          <p><strong>Experience Level:</strong> ${experienceLevel}</p>
          ${job.salary ? `<p><strong>Salary:</strong> ${jobSalary}</p>` : ''}
          ${job.description ? `
          <div>
            <h3>Job Description</h3>
            <p>${jobDescription}</p>
          </div>` : ''}
          ${job.requirements ? `
          <div>
            <h3>Requirements</h3>
            <p>${sanitize(job.requirements)}</p>
          </div>` : ''}
          <!-- Skills section not available in current data structure -->
          <p><a href="${sanitize(applicationUrl)}">Apply for this position</a></p>
        </div>
      </noscript>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

export function generateDefaultSEOHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>PingJob - Professional Networking Platform</title>
    <meta name="description" content="Connect with top talent and find your dream job on PingJob. Professional networking platform for job seekers, recruiters, and companies." />
    <link rel="canonical" href="https://pingjob.com/" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="PingJob - Professional Networking Platform" />
    <meta property="og:description" content="Connect with top talent and find your dream job on PingJob." />
    <meta property="og:site_name" content="PingJob" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="PingJob - Professional Networking Platform" />
    <meta name="twitter:description" content="Connect with top talent and find your dream job on PingJob." />
  </head>
  <body>
    <div id="root" style="display: block; visibility: visible; opacity: 1; width: 100%; min-height: 100vh;"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}
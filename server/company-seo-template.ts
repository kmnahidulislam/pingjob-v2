import type { CompanySEOData as CompanyDataType } from "../shared/schema";

export interface CompanySEOTemplateData {
  company: CompanyDataType;
  baseUrl: string;
  canonicalUrl?: string; // Optional - will default to baseUrl + /companies/id if not provided
}

export function generateCompanySEOHTML(data: CompanySEOTemplateData): string {
  const { company, baseUrl, canonicalUrl } = data;
  
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

  const companyName = sanitize(company.name || 'Company');
  const companyIndustry = sanitize(company.industry || '');
  const companyLocation = sanitize(company.location || 'Location not specified');
  const companyDescription = sanitize(company.description || '');
  const companySize = sanitize(company.size || '');
  
  // Create compelling descriptions optimized for social sharing
  const createSocialDescription = (maxLength: number) => {
    const basePrefix = `${companyName}`;
    const industryInfo = companyIndustry ? ` in ${companyIndustry}` : '';
    const locationInfo = companyLocation !== 'Location not specified' ? ` | ${companyLocation}` : '';
    const sizeInfo = companySize ? ` | ${companySize} employees` : '';
    
    if (company.description) {
      // Clean up description and extract key points
      const cleanDesc = company.description.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const baseInfo = `${basePrefix}${industryInfo}${locationInfo}`;
      const remainingLength = maxLength - baseInfo.length - 20; // Buffer for "View jobs and more..."
      
      if (remainingLength > 30) {
        const descPreview = cleanDesc.slice(0, remainingLength);
        return `${baseInfo}. ${descPreview}... View jobs and more on PingJob.`;
      }
      return `${baseInfo}. View open positions and company details on PingJob.`;
    }
    
    return `${basePrefix}${industryInfo}${locationInfo}${sizeInfo}. Discover career opportunities on PingJob.`;
  };
  
  const metaDescription = createSocialDescription(160); // Standard meta description
  const twitterDescription = createSocialDescription(200); // Twitter allows more
  const linkedInDescription = createSocialDescription(150); // LinkedIn prefers shorter
  
  const pageTitle = companyIndustry 
    ? `${companyName} - ${companyIndustry} Company | PingJob`
    : `${companyName} - Company Profile | PingJob`;
  const finalCanonicalUrl = canonicalUrl || `${baseUrl}/companies/${company.id}`;
  
  // Enhanced image fallback system for social sharing
  const getShareImage = () => {
    // Primary: Company logo
    if (company.logoUrl) {
      return `${baseUrl}${company.logoUrl}`;
    }
    
    // Secondary: Industry-specific default
    const industry = company.industry?.toLowerCase() || '';
    const industryDefaults = {
      'technology': `${baseUrl}/share-images/tech-company-default.png`,
      'software': `${baseUrl}/share-images/tech-company-default.png`,
      'engineering': `${baseUrl}/share-images/engineering-company-default.png`,
      'manufacturing': `${baseUrl}/share-images/manufacturing-company-default.png`,
      'marketing': `${baseUrl}/share-images/marketing-company-default.png`,
      'advertising': `${baseUrl}/share-images/marketing-company-default.png`,
      'sales': `${baseUrl}/share-images/sales-company-default.png`,
      'finance': `${baseUrl}/share-images/finance-company-default.png`,
      'banking': `${baseUrl}/share-images/finance-company-default.png`,
      'healthcare': `${baseUrl}/share-images/healthcare-company-default.png`,
      'medical': `${baseUrl}/share-images/healthcare-company-default.png`,
      'education': `${baseUrl}/share-images/education-company-default.png`,
      'consulting': `${baseUrl}/share-images/consulting-company-default.png`,
      'retail': `${baseUrl}/share-images/retail-company-default.png`,
      'hospitality': `${baseUrl}/share-images/hospitality-company-default.png`
    };
    
    // Check if industry matches any defaults
    for (const [key, imagePath] of Object.entries(industryDefaults)) {
      if (industry.includes(key)) {
        return imagePath;
      }
    }
    
    // Tertiary: Generic company profile image
    return `${baseUrl}/share-images/default-company-profile.png`;
  };
  
  const shareImageUrl = getShareImage();

  // Generate structured data (JSON-LD) for Organization
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Organization",
    "name": company.name,
    "description": company.description || `${company.name} company profile`,
    "url": finalCanonicalUrl,
    "logo": shareImageUrl,
    "image": shareImageUrl,
    "industry": company.industry || undefined,
    "location": company.location ? {
      "@type": "Place",
      "name": company.location
    } : undefined,
    "address": company.city || company.state || company.country ? {
      "@type": "PostalAddress",
      "addressLocality": company.city || undefined,
      "addressRegion": company.state || undefined,
      "addressCountry": company.country || "US"
    } : undefined,
    "telephone": company.phone || undefined,
    "email": undefined, // Not available in current schema
    "sameAs": [
      company.website,
      company.facebookUrl,
      company.twitterUrl,
      company.instagramUrl
    ].filter(Boolean),
    "numberOfEmployees": company.size || undefined,
    "foundingDate": company.createdAt ? new Date(company.createdAt).toISOString().split('T')[0] : undefined,
    "aggregateRating": company.followers ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5", // Default rating
      "reviewCount": company.followers
    } : undefined
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
    <meta name="keywords" content="${sanitize(`${company.name}, ${company.industry}, ${company.location}, company, jobs, careers`)}" />
    <link rel="canonical" href="${sanitize(finalCanonicalUrl)}" />
    
    <!-- Enhanced Open Graph Meta Tags for Social Sharing -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${sanitize(finalCanonicalUrl)}" />
    <meta property="og:title" content="${sanitize(pageTitle)}" />
    <meta property="og:description" content="${sanitize(metaDescription)}" />
    <meta property="og:image" content="${sanitize(shareImageUrl)}" />
    <meta property="og:image:secure_url" content="${sanitize(shareImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${sanitize(`${companyName} - Company Profile`)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:site_name" content="PingJob" />
    <meta property="og:locale" content="en_US" />
    <!-- Company-specific Open Graph tags -->
    <meta property="business:contact_data:locality" content="${sanitize(company.city || '')}" />
    <meta property="business:contact_data:region" content="${sanitize(company.state || '')}" />
    <meta property="business:contact_data:country_name" content="${sanitize(company.country || '')}" />
    ${company.website ? `<meta property="business:contact_data:website" content="${sanitize(company.website)}" />` : ''}
    ${company.phone ? `<meta property="business:contact_data:phone_number" content="${sanitize(company.phone)}" />` : ''}
    
    <!-- Enhanced Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@pingjob" />
    <meta name="twitter:url" content="${sanitize(finalCanonicalUrl)}" />
    <meta name="twitter:title" content="${sanitize(pageTitle)}" />
    <meta name="twitter:description" content="${sanitize(twitterDescription)}" />
    <meta name="twitter:image" content="${sanitize(shareImageUrl)}" />
    <meta name="twitter:image:alt" content="${sanitize(`${companyName} - Company Profile on PingJob`)}" />
    <!-- Twitter Creator tag if company has Twitter -->
    ${company.twitterUrl ? `<meta name="twitter:creator" content="${sanitize(company.twitterUrl.replace('https://twitter.com/', '@'))}" />` : ''}
    
    <!-- LinkedIn-Specific Optimization Tags -->
    <meta property="linkedin:owner" content="${sanitize(companyName)}" />
    <meta name="linkedin:title" content="${sanitize(pageTitle)}" />
    <meta name="linkedin:description" content="${sanitize(linkedInDescription)}" />
    <meta name="linkedin:image" content="${sanitize(shareImageUrl)}" />
    
    <!-- Additional Social Media Optimization -->
    <meta name="pinterest:title" content="${sanitize(pageTitle)}" />
    <meta name="pinterest:description" content="${sanitize(metaDescription)}" />
    <meta name="pinterest:image" content="${sanitize(shareImageUrl)}" />
    
    <!-- Facebook-specific tags -->
    <meta property="fb:app_id" content="pingjob" />
    
    <!-- Additional SEO Meta Tags -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="${sanitize(companyName)}" />
    <meta name="publisher" content="PingJob" />
    
    <!-- Company-Specific Meta Tags -->
    <meta name="company:name" content="${companyName}" />
    <meta name="company:industry" content="${companyIndustry}" />
    <meta name="company:location" content="${companyLocation}" />
    <meta name="company:size" content="${companySize}" />
    ${company.website ? `<meta name="company:website" content="${sanitize(company.website)}" />` : ''}
    
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
          <h1>${companyName}</h1>
          ${companyIndustry ? `<h2>${companyIndustry}</h2>` : ''}
          <p><strong>Location:</strong> ${companyLocation}</p>
          ${companySize ? `<p><strong>Company Size:</strong> ${companySize}</p>` : ''}
          ${company.description ? `
          <div>
            <h3>About ${companyName}</h3>
            <p>${companyDescription}</p>
          </div>` : ''}
          ${company.website ? `<p><strong>Website:</strong> <a href="${sanitize(company.website)}" target="_blank" rel="noopener">${sanitize(company.website)}</a></p>` : ''}
          ${company.phone ? `<p><strong>Phone:</strong> ${sanitize(company.phone)}</p>` : ''}
          <p><a href="${sanitize(finalCanonicalUrl)}">View open positions at ${companyName}</a></p>
        </div>
      </noscript>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}
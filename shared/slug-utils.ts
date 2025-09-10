/**
 * Utility functions for generating and handling URL slugs
 */

/**
 * Generate a URL-friendly slug from a string
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 60 characters for SEO best practices
    .substring(0, 60)
    // Remove trailing hyphen if truncation created one
    .replace(/-+$/, '');
}

/**
 * Generate a job URL with ID and slug
 */
export function generateJobUrl(id: number, title: string): string {
  const slug = generateSlug(title);
  return `/jobs/${id}-${slug}`;
}

/**
 * Generate a company URL with ID and slug
 */
export function generateCompanyUrl(id: number, name: string): string {
  const slug = generateSlug(name);
  return `/companies/${id}-${slug}`;
}

/**
 * Parse a slug URL to extract ID and slug
 * Returns null if the format is invalid
 */
export function parseSlugUrl(path: string): { id: number; slug: string } | null {
  // Match patterns like /jobs/123-software-engineer or /companies/456-acme-corp
  const match = path.match(/^\/(?:jobs|companies)\/(\d+)-(.+)$/);
  
  if (!match) {
    return null;
  }
  
  const id = parseInt(match[1], 10);
  const slug = match[2];
  
  if (isNaN(id)) {
    return null;
  }
  
  return { id, slug };
}

/**
 * Parse a legacy ID-only URL to extract just the ID
 * Returns null if the format is invalid
 */
export function parseLegacyUrl(path: string): { id: number; type: 'job' | 'company' } | null {
  // Match patterns like /jobs/123 or /companies/456
  const match = path.match(/^\/(jobs|companies)\/(\d+)$/);
  
  if (!match) {
    return null;
  }
  
  const type = match[1] === 'jobs' ? 'job' : 'company';
  const id = parseInt(match[2], 10);
  
  if (isNaN(id)) {
    return null;
  }
  
  return { id, type };
}

/**
 * Check if a URL has the correct slug format
 * Used to determine if a 301 redirect is needed
 */
export function isCanonicalUrl(path: string, expectedId: number, expectedTitle: string): boolean {
  const parsed = parseSlugUrl(path);
  if (!parsed) return false;
  
  if (parsed.id !== expectedId) return false;
  
  const expectedSlug = generateSlug(expectedTitle);
  return parsed.slug === expectedSlug;
}

/**
 * Get the canonical URL for a given path and expected data
 * Returns null if the current path is already canonical
 */
export function getCanonicalUrl(
  currentPath: string,
  id: number,
  title: string,
  type: 'job' | 'company'
): string | null {
  const canonicalPath = type === 'job' 
    ? generateJobUrl(id, title)
    : generateCompanyUrl(id, title);
  
  // If current path is already canonical, return null
  if (currentPath === canonicalPath) {
    return null;
  }
  
  return canonicalPath;
}
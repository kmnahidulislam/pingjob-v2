import { Capacitor } from '@capacitor/core';

/**
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // In mobile environment, always use production server
  if (Capacitor.isNativePlatform()) {
    console.log('🔧 Mobile environment detected - using https://pingjob.com');
    return 'https://pingjob.com';
  }
  
  // In web environment, use relative URLs (they work fine)
  console.log('🌐 Web environment detected - using relative URLs');
  return '';
}

/**
 * Convert relative API URL to absolute URL when needed
 */
export function resolveApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  // If path already includes protocol, return as-is
  if (path.startsWith('http')) {
    console.log(`🔗 URL already absolute: ${path}`);
    return path;
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const resolvedUrl = `${baseUrl}${cleanPath}`;
  
  console.log(`🔗 Resolved API URL: ${path} -> ${resolvedUrl}`);
  return resolvedUrl;
}

/**
 * Check if we're in mobile environment
 */
export function isMobileEnvironment(): boolean {
  return Capacitor.isNativePlatform();
}
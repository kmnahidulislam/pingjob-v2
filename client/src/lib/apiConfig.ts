import { Capacitor } from '@capacitor/core';

/**
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // In mobile environment, always use production server
  if (Capacitor.isNativePlatform()) {
    return 'https://pingjob.com';
  }
  
  // In web environment, use relative URLs (they work fine)
  return '';
}

/**
 * Convert relative API URL to absolute URL when needed
 */
export function resolveApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  // If path already includes protocol, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if we're in mobile environment
 */
export function isMobileEnvironment(): boolean {
  return Capacitor.isNativePlatform();
}
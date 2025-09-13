import { Capacitor } from '@capacitor/core';

/**
 * Get the correct API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // Enhanced mobile detection for Android WebView
  const isAndroidWebView = /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
  const isCapacitorApp = document.URL.startsWith('capacitor://') || 
                         document.URL.startsWith('ionic://') ||
                         (window as any).Capacitor !== undefined ||
                         (window as any).cordova !== undefined;
  const isLocalhost = document.URL.includes('localhost');
  const isFileProtocol = document.URL.startsWith('file://');
  
  // Try Capacitor detection
  let isCapacitorNative = false;
  try {
    isCapacitorNative = Capacitor.isNativePlatform();
  } catch (e) {
    console.log('Capacitor not available, using alternative detection');
  }
  
  const isNative = isCapacitorNative || isAndroidWebView || isCapacitorApp || isFileProtocol;
  
  console.log('🔍 Mobile detection debug:', {
    isAndroidWebView,
    isCapacitorApp,
    isLocalhost,
    isFileProtocol,
    isCapacitorNative,
    userAgent: navigator.userAgent,
    documentURL: document.URL,
    isNative
  });
  
  // In mobile environment, always use production server
  if (isNative) {
    console.log('🔧 Mobile environment detected - using https://www.pingjob.com');
    return 'https://www.pingjob.com';
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
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    // Fallback detection if Capacitor is not available
    const isAndroidWebView = /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
    const isCapacitorApp = document.URL.startsWith('capacitor://') || 
                           document.URL.startsWith('ionic://') ||
                           (window as any).Capacitor !== undefined;
    return isAndroidWebView || isCapacitorApp;
  }
}
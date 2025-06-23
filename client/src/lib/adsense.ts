// Google AdSense initialization and management

export const initializeAdSense = () => {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;
  
  if (!clientId) {
    console.warn('Google AdSense client ID not configured');
    return;
  }

  // Add AdSense script to head if not already present
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  // Initialize adsbygoogle array
  if (typeof window !== 'undefined') {
    window.adsbygoogle = window.adsbygoogle || [];
  }
};

export const refreshAds = () => {
  if (typeof window !== 'undefined' && window.adsbygoogle) {
    try {
      (window.adsbygoogle as any).push({});
    } catch (error) {
      console.error('Error refreshing ads:', error);
    }
  }
};

// Predefined ad slots for consistent placement
export const AD_SLOTS = {
  BANNER_TOP: 'banner-top',
  SIDEBAR_PRIMARY: 'sidebar-primary', 
  SIDEBAR_SECONDARY: 'sidebar-secondary',
  CONTENT_MIDDLE: 'content-middle',
  FOOTER: 'footer',
  JOB_LISTING: 'job-listing',
  COMPANY_PAGE: 'company-page'
} as const;

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
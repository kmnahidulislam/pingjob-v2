import { useEffect } from 'react';

interface GoogleAdsenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  adLayout?: string;
  adLayoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAdsense({
  adSlot,
  adFormat = 'auto',
  adLayout,
  adLayoutKey,
  style = { display: 'block' },
  className = ''
}: GoogleAdsenseProps) {
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;
    if (!clientId) {
      if (import.meta.env.DEV) {
        console.warn('Google AdSense client ID not configured');
      }
      return;
    }

    // Skip AdSense initialization in development to prevent fetch errors
    if (import.meta.env.DEV) {
      console.log('AdSense ad initialized (dev mode):', adSlot);
      return;
    }

    try {
      // Initialize AdSense if not already done
      if (typeof window !== 'undefined') {
        // Ensure adsbygoogle array exists
        window.adsbygoogle = window.adsbygoogle || [];
        
        // Push the ad configuration with error handling
        const timeout = setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (error) {
            // Silently handle errors to prevent runtime overlay
          }
        }, 500);

        return () => clearTimeout(timeout);
      }
    } catch (error) {
      // Silently handle errors to prevent runtime overlay
    }
  }, [adSlot]);

  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  // Show placeholder if AdSense is not configured or in development
  if (!clientId || import.meta.env.DEV) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[100px] ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">
          {import.meta.env.DEV ? 'AdSense Preview (Dev Mode)' : 'AdSense Placeholder'}
        </span>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client={clientId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-ad-layout={adLayout}
      data-ad-layout-key={adLayoutKey}
      data-full-width-responsive="true"
    />
  );
}
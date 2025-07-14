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
      console.warn('Google AdSense client ID not configured');
      return;
    }

    try {
      // Initialize AdSense if not already done
      if (typeof window !== 'undefined') {
        // Ensure adsbygoogle array exists
        window.adsbygoogle = window.adsbygoogle || [];
        
        // Push the ad configuration
        const timeout = setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            if (import.meta.env.DEV) console.log('AdSense ad initialized:', adSlot);
          } catch (error) {
            console.error('AdSense push error:', error);
          }
        }, 100);

        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }, [adSlot]);

  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  // Show placeholder if AdSense is not configured
  if (!clientId) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">AdSense Placeholder</span>
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
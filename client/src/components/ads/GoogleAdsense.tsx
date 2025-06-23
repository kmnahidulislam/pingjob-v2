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
    if (!import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID) {
      console.warn('Google AdSense client ID not configured');
      return;
    }

    try {
      // Initialize AdSense if not already done
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ad initialized:', adSlot);
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adSlot]);

  // Show placeholder if AdSense is not configured
  if (!import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID) {
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
      data-ad-client={import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-ad-layout={adLayout}
      data-ad-layout-key={adLayoutKey}
      data-full-width-responsive="true"
    />
  );
}
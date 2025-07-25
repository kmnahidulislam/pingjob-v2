import { useEffect } from 'react';

interface GoogleAdsenseProps {
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function GoogleAdsense({
  style = { display: 'block' },
  className = ''
}: GoogleAdsenseProps) {
  useEffect(() => {
    // Skip AdSense initialization in development to prevent fetch errors
    if (import.meta.env.DEV) {
      console.log('AdSense ad initialized (dev mode)');
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
  }, []);

  // Show placeholder if in development
  if (import.meta.env.DEV) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[100px] ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">AdSense Preview (Dev Mode)</span>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-format="fluid"
      data-ad-layout-key="-gw-3+1f-3d+2z"
      data-ad-client="ca-pub-9555763610767023"
      data-ad-slot="5864590173"
    />
  );
}
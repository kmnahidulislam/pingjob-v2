import GoogleAdsense from './GoogleAdsense';
import { AD_SLOTS } from '@/lib/adsense';

interface AdBannerProps {
  slot: keyof typeof AD_SLOTS;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ slot, className, style }: AdBannerProps) {
  const adSlotConfig = {
    [AD_SLOTS.BANNER_TOP]: {
      format: 'auto' as const,
      style: { display: 'block', width: '100%', height: '90px', ...style }
    },
    [AD_SLOTS.SIDEBAR_PRIMARY]: {
      format: 'rectangle' as const,
      style: { display: 'block', width: '300px', height: '250px', ...style }
    },
    [AD_SLOTS.SIDEBAR_SECONDARY]: {
      format: 'vertical' as const,
      style: { display: 'block', width: '160px', height: '600px', ...style }
    },
    [AD_SLOTS.CONTENT_MIDDLE]: {
      format: 'auto' as const,
      style: { display: 'block', width: '100%', height: '280px', ...style }
    },
    [AD_SLOTS.FOOTER]: {
      format: 'horizontal' as const,
      style: { display: 'block', width: '100%', height: '90px', ...style }
    },
    [AD_SLOTS.JOB_LISTING]: {
      format: 'rectangle' as const,
      style: { display: 'block', width: '300px', height: '250px', ...style }
    },
    [AD_SLOTS.COMPANY_PAGE]: {
      format: 'auto' as const,
      style: { display: 'block', width: '100%', height: '200px', ...style }
    }
  };

  const config = adSlotConfig[AD_SLOTS[slot]];

  return (
    <div className={`ad-container ${className || ''}`}>
      <GoogleAdsense
        adSlot={AD_SLOTS[slot]}
        adFormat={config.format}
        style={config.style}
        className="rounded-lg border border-gray-200 bg-gray-50"
      />
    </div>
  );
}
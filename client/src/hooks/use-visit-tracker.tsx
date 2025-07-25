import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export const useVisitTracker = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    // Track visit when location changes
    const trackVisit = async () => {
      try {
        await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: location
          })
        });
      } catch (error) {
        // Silently fail to avoid disrupting user experience
        if (import.meta.env.DEV) {
          console.warn('Failed to track visit:', error);
        }
      }
    };

    trackVisit();
  }, [location]);
};

export const useTotalVisits = () => {
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    const fetchTotalVisits = async () => {
      try {
        const response = await fetch('/api/total-visits');
        const data = await response.json();
        setTotalVisits(data.totalVisits);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to fetch total visits:', error);
        }
      }
    };

    fetchTotalVisits();
  }, []);

  return totalVisits;
};
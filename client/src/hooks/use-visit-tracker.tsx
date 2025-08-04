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

    // Initial fetch
    fetchTotalVisits();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchTotalVisits, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return totalVisits;
};

// Hook for real-time visit statistics
export const useVisitStats = () => {
  const [stats, setStats] = useState({
    totalVisits: 0,
    todayVisits: 0,
    visitsByPage: {},
    dailyVisits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/visit-stats');
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to fetch visit stats:', error);
        }
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();
    
    // Set up polling for real-time updates every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};
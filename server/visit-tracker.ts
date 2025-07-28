// Simple in-memory visit tracking system
// This provides basic visit analytics without requiring database changes

interface VisitData {
  timestamp: number;
  ip?: string;
  userAgent?: string;
  page: string;
  userId?: string;
  sessionId?: string;
}

class VisitTracker {
  private visits: VisitData[] = [];
  private dailyCounts: Map<string, number> = new Map();
  
  constructor() {
    // Add some sample data for testing
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    // Add sample visits for the last 3 days
    const sampleVisits = [
      // Today's visits
      { page: '/', timestamp: today.getTime() - 3600000 }, // 1 hour ago
      { page: '/jobs', timestamp: today.getTime() - 7200000 }, // 2 hours ago
      { page: '/companies', timestamp: today.getTime() - 1800000 }, // 30 min ago
      { page: '/dashboard', timestamp: today.getTime() - 900000 }, // 15 min ago
      { page: '/traffic', timestamp: today.getTime() - 300000 }, // 5 min ago
      
      // Yesterday's visits
      { page: '/', timestamp: yesterday.getTime() - 3600000 },
      { page: '/jobs', timestamp: yesterday.getTime() - 7200000 },
      { page: '/companies', timestamp: yesterday.getTime() - 1800000 },
      
      // Two days ago
      { page: '/', timestamp: twoDaysAgo.getTime() - 3600000 },
      { page: '/jobs', timestamp: twoDaysAgo.getTime() - 7200000 }
    ];
    
    this.visits = sampleVisits;
    
    // Update daily counts
    const todayKey = today.toISOString().split('T')[0];
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const twoDaysKey = twoDaysAgo.toISOString().split('T')[0];
    
    this.dailyCounts.set(todayKey, 5);
    this.dailyCounts.set(yesterdayKey, 3);
    this.dailyCounts.set(twoDaysKey, 2);
  }

  recordVisit(data: {
    ip?: string;
    userAgent?: string;
    page: string;
    userId?: string;
    sessionId?: string;
  }) {
    const visit: VisitData = {
      ...data,
      timestamp: Date.now()
    };
    
    this.visits.push(visit);
    
    // Update daily counts
    const dateKey = new Date().toISOString().split('T')[0];
    this.dailyCounts.set(dateKey, (this.dailyCounts.get(dateKey) || 0) + 1);
    
    // Keep only last 30 days of visits to prevent memory bloat
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.visits = this.visits.filter(v => v.timestamp > thirtyDaysAgo);
    
    // Clean up old daily counts
    const thirtyDaysAgoDate = new Date(thirtyDaysAgo).toISOString().split('T')[0];
    for (const [date, _] of this.dailyCounts) {
      if (date < thirtyDaysAgoDate) {
        this.dailyCounts.delete(date);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Visit recorded: ${data.page} (Total: ${this.visits.length})`);
    }
  }

  getTotalVisits(): number {
    return this.visits.length;
  }

  getTodayVisits(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyCounts.get(today) || 0;
  }

  getVisitsByPage(): { [page: string]: number } {
    const pageCounts: { [page: string]: number } = {};
    for (const visit of this.visits) {
      pageCounts[visit.page] = (pageCounts[visit.page] || 0) + 1;
    }
    return pageCounts;
  }

  getDailyVisits(days: number = 7): { date: string; count: number }[] {
    const result: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        count: this.dailyCounts.get(dateKey) || 0
      });
    }
    
    return result;
  }

  getStats() {
    return {
      totalVisits: this.getTotalVisits(),
      todayVisits: this.getTodayVisits(),
      visitsByPage: this.getVisitsByPage(),
      dailyVisits: this.getDailyVisits()
    };
  }
}

export const visitTracker = new VisitTracker();
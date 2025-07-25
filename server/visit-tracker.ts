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
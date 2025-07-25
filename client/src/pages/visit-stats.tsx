import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, TrendingUp, Calendar, Globe } from 'lucide-react';

interface VisitStats {
  totalVisits: number;
  todayVisits: number;
  visitsByPage: { [page: string]: number };
  dailyVisits: { date: string; count: number }[];
}

export default function VisitStats() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/visit-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch visit stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Failed to load visit statistics</div>
      </div>
    );
  }

  const topPages = Object.entries(stats.visitsByPage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Visit Analytics</h1>
          <p className="text-gray-600 mt-2">Track and analyze website traffic patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayVisits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Since midnight</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pages Tracked</CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.visitsByPage).length}</div>
              <p className="text-xs text-muted-foreground">Unique pages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.totalVisits / Math.max(stats.dailyVisits.length, 1))}
              </div>
              <p className="text-xs text-muted-foreground">Visits per day</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Visits Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Daily Visits Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyVisits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [value, 'Visits']}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Most Visited Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.map(([page, count], index) => (
                <div key={page} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{page === '/' ? 'Home' : page}</p>
                      <p className="text-xs text-gray-500">{page}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useVisitStats } from "@/hooks/use-visit-tracker";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Eye,
  MessageSquare,
  Building,
  UserCheck,
  Clock,
  Star,
  Activity
} from "lucide-react";
import type { UserType } from "@/lib/types";

interface DashboardStatsProps {
  userType: UserType;
}

export default function DashboardStats({ userType }: DashboardStatsProps) {
  // Real-time traffic statistics for admin users
  const { stats: trafficStats } = useVisitStats();
  
  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: userType === 'job_seeker'
  });

  const { data: jobApplications } = useQuery({
    queryKey: ['/api/applications'],
    enabled: userType === 'job_seeker'
  });

  const { data: recruiterJobs } = useQuery({
    queryKey: ['/api/recruiter/jobs'],
    enabled: userType === 'recruiter'
  });

  const { data: allJobs } = useQuery({
    queryKey: ['/api/jobs'],
    enabled: userType === 'recruiter' || userType === 'client' || userType === 'admin'
  });

  const { data: allCompanies } = useQuery({
    queryKey: ['/api/companies'],
    enabled: userType === 'admin' || userType === 'client'
  });

  const { data: company } = useQuery({
    queryKey: ['/api/user/company'],
    enabled: userType === 'client'
  });

  const renderJobSeekerStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">This week</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connections</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(connections as any[])?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Total connections</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Applications</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(jobApplications as any[])?.length || 0}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecruiterStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(allJobs as any[])?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Currently posted</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Applications</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success-green">127</div>
          <p className="text-xs text-muted-foreground">This week</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interviews</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning-orange">8</div>
          <p className="text-xs text-muted-foreground">Scheduled</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hired</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success-green">3</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Followers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(company as any)?.followers || 0}</div>
          <p className="text-xs text-muted-foreground">Company followers</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">Currently posted</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Page Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,245</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  );

  const { data: adminStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: userType === 'admin'
  });

  const renderAdminStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-linkedin-blue">{(adminStats as any)?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">Platform members</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success-green">{(adminStats as any)?.activeJobs || 0}</div>
          <p className="text-xs text-muted-foreground">Currently available</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning-orange">{(adminStats as any)?.totalCompanies || 0}</div>
          <p className="text-xs text-muted-foreground">Approved companies</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{trafficStats.totalVisits || 0}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{trafficStats.todayVisits || 0}</div>
          <p className="text-xs text-muted-foreground">Real-time updates</p>
        </CardContent>
      </Card>
    </div>
  );

  switch (userType) {
    case 'job_seeker':
      return renderJobSeekerStats();
    case 'recruiter':
      return renderRecruiterStats();
    case 'client':
      return renderClientStats();
    case 'admin':
      return renderAdminStats();
    default:
      return null;
  }
}

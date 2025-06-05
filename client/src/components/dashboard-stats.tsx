import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
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
  Star
} from "lucide-react";
import type { UserType } from "@/lib/types";

interface DashboardStatsProps {
  userType: UserType;
}

export default function DashboardStats({ userType }: DashboardStatsProps) {
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
          <div className="text-2xl font-bold">{connections?.length || 0}</div>
          <p className="text-xs text-muted-foreground">Total connections</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Applications</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{jobApplications?.length || 0}</div>
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
          <div className="text-2xl font-bold">{allJobs?.length || 0}</div>
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
          <div className="text-2xl font-bold">{company?.followers || 0}</div>
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

  const renderAdminStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-linkedin-blue">15,847</div>
          <p className="text-xs text-muted-foreground">+12% from last month</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success-green">1,293</div>
          <p className="text-xs text-muted-foreground">+8% from last month</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning-orange">$24,750</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      <Card className="dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,847</div>
          <p className="text-xs text-muted-foreground">Currently online</p>
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

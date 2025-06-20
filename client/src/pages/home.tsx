import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import DashboardStats from "@/components/dashboard-stats";
import JobCard from "@/components/job-card";
import { 
  Plus, 
  Eye, 
  Users, 
  Layers, 
  Briefcase,
  TrendingUp,
  Bell,
  MessageSquare
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function Home() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?limit=4');
      return res.json();
    }
  });

  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ['/api/connection-requests'],
    enabled: !!user
  });

  const { data: jobApplications } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user && user.userType === 'job_seeker'
  });

  const { data: experiences } = useQuery({
    queryKey: [`/api/experience/${user?.id}`],
    enabled: !!user?.id
  });

  const { data: education } = useQuery({
    queryKey: [`/api/education/${user?.id}`],
    enabled: !!user?.id
  });

  const { data: skills } = useQuery({
    queryKey: [`/api/skills/${user?.id}`],
    enabled: !!user?.id
  });

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let completion = 20; // Base score for having a profile
    
    if ((profile as any).headline) completion += 15;
    if ((profile as any).summary) completion += 15;
    if ((profile as any).location) completion += 10;
    if (experiences && Array.isArray(experiences) && experiences.length > 0) completion += 20;
    if (education && Array.isArray(education) && education.length > 0) completion += 10;
    if (skills && Array.isArray(skills) && skills.length > 0) completion += 10;
    
    return Math.min(completion, 100);
  };

  const profileCompletion = calculateProfileCompletion();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Logo Header */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <img 
            src={logoPath} 
            alt="PingJob Logo" 
            className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Card */}
          <div className="space-y-6">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">{(profile as any)?.headline || 'Add a headline'}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Profile Completeness</span>
                  <span className="font-semibold">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="progress-bar" />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>Profile views this week</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{Array.isArray(connections) ? connections.length : 0} connections</span>
                </div>
              </div>
              
              <Button 
                asChild 
                variant="outline" 
                className="w-full mt-4"
              >
                <Link href={`/profile/${user.id}`}>
                  View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/profile/${user.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/network">
                  <Users className="h-4 w-4 mr-2" />
                  Find Connections
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard">
                  <Layers className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dashboard Stats */}
          <DashboardStats userType={user.userType} />

          {/* Recent Activity / Notifications */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(connectionRequests) && connectionRequests.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-linkedin-blue" />
                  <span className="text-sm">
                    {connectionRequests.length} new connection request{connectionRequests.length > 1 ? 's' : ''}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/network">
                      View
                    </Link>
                  </Button>
                </div>
              )}
              
              {user.userType === 'job_seeker' && (
                <>
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-success-green" />
                    <span className="text-sm">Your profile was viewed 12 times this week</span>
                  </div>
                  
                  {Array.isArray(jobApplications) && jobApplications.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-linkedin-blue" />
                      <span className="text-sm">
                        Applied to {jobApplications.length} job{jobApplications.length > 1 ? 's' : ''} this month
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {user.userType === 'recruiter' && (
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-warning-orange" />
                  <span className="text-sm">Your job posts received 45 new applications</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Jobs (for Job Seekers) or Recent Applications (for Recruiters) */}
          {user.userType === 'job_seeker' && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recommended Jobs</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/jobs">View All</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentJobs && recentJobs.length > 0 ? (
                  recentJobs.slice(0, 3).map((job: any) => (
                    <div key={job.id} className="border-l-4 border-linkedin-blue pl-4">
                      <h4 className="font-medium text-sm">{job.title}</h4>
                      <p className="text-xs text-gray-600">{job.company?.name || 'Unknown Company'} • {job.location}</p>
                      <p className="text-xs text-linkedin-blue">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No job recommendations available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Jobs Grid */}
          {recentJobs && recentJobs.length > 0 && (
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Latest Job Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentJobs.slice(0, 4).map((job: any) => (
                    <JobCard key={job.id} job={job} compact />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

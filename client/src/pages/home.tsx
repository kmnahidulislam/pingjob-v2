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
// AdBanner removed to prevent development errors

export default function Home() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id
  });

  const { data: recentJobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?limit=4');
      return res.json();
    }
  });

  // Also fetch admin jobs for the Latest Job Opportunities section
  const { data: adminJobs, isLoading: adminJobsLoading, error: adminJobsError } = useQuery({
    queryKey: ['/api/admin-jobs'],
    enabled: true
  });

  // Debug logging only in development
  if (import.meta.env.DEV) {
    if (import.meta.env.DEV) console.log('=== HOME PAGE JOBS DEBUG ===');
    console.log('Recent jobs (API jobs) loading:', jobsLoading);
    console.log('Recent jobs (API jobs) error:', jobsError);
    console.log('Recent jobs (API jobs) data:', recentJobs);
    console.log('Recent jobs (API jobs) length:', Array.isArray(recentJobs) ? recentJobs.length : 0);
    console.log('Admin jobs loading:', adminJobsLoading);
    console.log('Admin jobs error:', adminJobsError);
    console.log('Admin jobs data:', adminJobs);
    console.log('Admin jobs length:', Array.isArray(adminJobs) ? adminJobs.length : 0);
    console.log('=============================');
  }

  const { data: connections } = useQuery({
    queryKey: ['/api/connections'],
    enabled: !!user
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ['/api/connection-requests'],
    enabled: !!user
  });

  const { data: jobApplications = [] } = useQuery({
    queryKey: ['/api/applications', { limit: 3 }],
    queryFn: async () => {
      const response = await fetch('/api/applications?limit=3', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data.slice(0, 3) : []; // Max 3 applications for dashboard
    },
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

  // Show public home for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={logoPath} alt="PingJob" className="h-8 w-auto" />
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-4">
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600">Jobs</Link>
                <Link href="/companies" className="text-gray-700 hover:text-blue-600">Companies</Link>
                <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
                <Link href="/auth">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Find Your Dream</span>
                    <span className="block text-blue-600">Career Today</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl lg:mx-0">
                    Connect with top employers, discover amazing opportunities, and take the next step in your professional journey. Join thousands of professionals who found their perfect job through PingJob.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link href="/auth">
                        <Button size="lg" className="w-full px-8 py-3">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link href="/jobs">
                        <Button variant="outline" size="lg" className="w-full px-8 py-3">
                          Browse Jobs
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Why Choose PingJob?
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Everything you need to advance your career
              </p>
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Quality Jobs</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Curated job opportunities from top companies across all industries.
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Professional Network</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Connect with industry professionals and expand your network.
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Career Growth</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Tools and resources to help you advance in your career.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <img src={logoPath} alt="PingJob" className="h-8 w-auto mb-4" />
                <p className="text-gray-400 text-sm">
                  Professional networking platform connecting talent with opportunities.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">For Job Seekers</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                  <li><Link href="/companies" className="hover:text-white">Company Profiles</Link></li>
                  <li><Link href="/auth" className="hover:text-white">Create Profile</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">For Employers</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/pricing" className="hover:text-white">Post Jobs</Link></li>
                  <li><Link href="/auth" className="hover:text-white">Employer Login</Link></li>
                  <li><Link href="/contact-sales" className="hover:text-white">Contact Sales</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 PingJob. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

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
      
      {/* Top Banner Advertisement */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Advertisement - Banner Top - Disabled in development */}
        </div>
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

          {/* Advertisement - Sidebar Primary - Disabled in development */}
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
                        Applied to {Math.min(jobApplications.length, 3)} recent job{jobApplications.length > 1 ? 's' : ''}
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
                      <p className="text-xs text-gray-600">
                        {job.company?.name || 'Unknown Company'} • {
                          (() => {
                            if (job.company?.location) {
                              const cleaned = job.company.location
                                .replace(/, United States$/, '')
                                .replace(/ United States$/, '')
                                .replace(/United States,?\s*/, '')
                                .trim();
                              const parts = cleaned.split(',').map((p: string) => p.trim()).filter(Boolean);
                              return parts.length >= 3 ? parts.slice(-2).join(', ') : cleaned;
                            }
                            return job.location || 'Remote';
                          })()
                        }
                      </p>
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
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Latest Job Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(adminJobs) && adminJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(adminJobs) ? adminJobs.slice(0, 4).map((job: any, index: number) => {
                    return <JobCard key={job.id} job={job} compact showCompany={true} />;
                  }) : []}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No job opportunities available at the moment. Check back later!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar for non-authenticated users - Show Categories and Companies */}
        {!user && (
          <div className="space-y-6">
            {/* Top Job Categories */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Top Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Categories will be loaded here */}
                  <p className="text-gray-500 text-sm">Loading categories...</p>
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Top Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Companies will be loaded here */}
                  <p className="text-gray-500 text-sm">Loading companies...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

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
  MessageSquare,
  Building2
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

  // Fetch job categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories']
  });

  // Fetch top companies
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/companies/top']
  });

  const { data: recentJobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?limit=6');
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

  // Fetch platform stats for the original home design
  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform-stats'],
    enabled: !user
  });

  // Show public home for non-authenticated users - recreate the exact original design
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img src={logoPath} alt="PingJob" className="h-8 w-auto" />
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button size="sm" className="absolute right-1 top-1 bg-blue-500 hover:bg-blue-600">
                    Go
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex items-center space-x-6">
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600 font-medium">Jobs</Link>
                <Link href="/companies" className="text-gray-700 hover:text-blue-600 font-medium">Companies</Link>
                <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
                <Link href="/auth">
                  <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">Sign Up</Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-blue-500 hover:bg-blue-600">Login</Button>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Feature Highlights */}
        <div className="bg-white py-8 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-green-600 font-semibold text-sm">100% Client-Only Jobs</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-blue-600 font-semibold text-sm">10X Recruiter Engagement</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-purple-600 font-semibold text-sm">One Clear Goal</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
                  </svg>
                </div>
                <div>
                  <div className="text-gray-600 font-semibold text-sm">AI-Powered Matching</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-orange-600 font-semibold text-sm">Real-Time Analytics</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-red-600 font-semibold text-sm">Resume Score™</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {Array.isArray(recentJobs) ? recentJobs.length : '14688'}
                </div>
                <div className="text-gray-600 font-medium">Active Jobs</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {platformStats?.totalCompanies || '76823'}
                </div>
                <div className="text-gray-600 font-medium">Top Companies</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {Array.isArray(categories) ? categories.length : '139'}
                </div>
                <div className="text-gray-600 font-medium">Categories</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">2203</div>
                <div className="text-gray-600 font-medium">Posted Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Top Job Categories */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Job Categories</h2>
              <div className="space-y-4">
                {Array.isArray(categories) && categories.slice(0, 8).map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Link 
                      href={`/jobs?category=${category.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {category.name}
                    </Link>
                    <span className="text-gray-500 font-medium">
                      {category.jobCount || '687'} jobs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Latest Job Opportunities */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Latest Job Opportunities</h2>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  🔄 Refresh
                </Button>
              </div>
              <div className="space-y-6">
                {Array.isArray(recentJobs) && recentJobs.slice(0, 4).map((job: any) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Company Logo */}
                        <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0 p-2">
                          {job.company?.logoUrl && job.company.logoUrl !== "NULL" && job.company.logoUrl !== "logos/NULL" ? (
                            <img 
                              src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                              alt={job.company?.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white rounded">
                              <Briefcase className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-blue-600 font-semibold mb-2">
                            {job.company?.name || "Unknown Company"}
                          </p>
                          <p className="text-gray-600 mb-3">
                            📍 {job.location || "Remote"}
                          </p>
                          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                            {job.description?.substring(0, 120)}...
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-sm">
                              New Today
                            </span>
                            <Link href={`/jobs/${job.id}`}>
                              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

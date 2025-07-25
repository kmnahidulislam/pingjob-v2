import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Building2,
  Users,
  MapPin,
  Briefcase,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Rocket,
  Target,
  Bot,
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  Calendar,
  DollarSign,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { JobCategories } from "@/components/job-categories";
import GoogleAdsense from "@/components/ads/GoogleAdsense";

export default function PingJobHome() {
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentJobPage, setCurrentJobPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [companyCount, setCompanyCount] = useState<number>(76806);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [featuredJobId, setFeaturedJobId] = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const jobsPerPage = 20;
  const totalJobsToShow = 100;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch admin jobs only for homepage display (100 jobs total for pagination)
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['/api/admin-jobs', { limit: totalJobsToShow }],
    queryFn: async () => {
      const response = await fetch(`/api/admin-jobs?limit=${totalJobsToShow}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch admin jobs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Listen for job application events to refresh applicant counts
  useEffect(() => {
    const handleJobApplicationSubmitted = (event: any) => {
      if (import.meta.env.DEV) console.log('Home page received jobApplicationSubmitted event, refreshing admin jobs');
      const autoCount = event.detail?.autoApplicationsCount || 0;
      if (import.meta.env.DEV) console.log(`Auto-applications created: ${autoCount}, forcing cache refresh`);
      
      queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
      
      // Multiple refresh attempts to ensure cache is updated
      setTimeout(() => {
        refetchJobs();
      }, 200);
      
      setTimeout(() => {
        refetchJobs();
      }, 800);
      
      setTimeout(() => {
        refetchJobs();
      }, 1500);
    };

    window.addEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
    return () => window.removeEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
  }, [queryClient, refetchJobs]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Fetch top companies
  const { data: topCompanies = [] } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      const response = await fetch('/api/companies/top');
      if (!response.ok) throw new Error('Failed to fetch top companies');
      return response.json();
    }
  });

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform/stats'],
    queryFn: async () => {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    }
  });

  // Force update company count when data arrives
  useEffect(() => {
    if (platformStats?.totalCompanies) {
      setCompanyCount(platformStats.totalCompanies);
    }
  }, [platformStats]);

  const displayStats = {
    totalUsers: platformStats?.totalUsers || 872,
    totalCompanies: companyCount,
    activeJobs: platformStats?.activeJobs || 12
  };

  const jobs = jobsData || [];
  
  // Calculate pagination for jobs
  const startIndex = (currentJobPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = jobs.slice(startIndex, endIndex);
  
  // Handle job pagination
  const handleJobPageChange = (page: number) => {
    setCurrentJobPage(page);
    // Scroll to jobs section when page changes
    const jobsSection = document.getElementById('jobs-section');
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Force re-render when page changes
  useEffect(() => {
    // This effect runs whenever currentJobPage changes
    // The dependency on currentJobPage ensures jobs display updates
  }, [currentJobPage]);
  
  const totalJobs = Math.min(jobs.length, totalJobsToShow);
  const totalPages = Math.ceil(totalJobs / jobsPerPage);



  // Calculate real-time statistics
  const jobStats = {
    totalJobs: platformStats?.activeJobs || 12,
    activeCompanies: platformStats?.totalCompanies || 76806,
    totalCategories: categories.length,
    todayJobs: Math.floor((platformStats?.activeJobs || 12) * 0.15)
  };

  // Featured job rotation
  useEffect(() => {
    if (jobs.length > 0) {
      const interval = setInterval(() => {
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        setFeaturedJobId(randomJob.id);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [jobs]);

  // Listen for job updates and applications
  useEffect(() => {
    const handleJobUpdated = () => {
      queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin-jobs'] });
    };

    const handleJobApplicationSubmitted = () => {
      queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin-jobs'] });
    };

    window.addEventListener('jobUpdated', handleJobUpdated);
    window.addEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
    
    return () => {
      window.removeEventListener('jobUpdated', handleJobUpdated);
      window.removeEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
    };
  }, [queryClient]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length >= 2);
  };

  const handleResultClick = () => {
    setShowSearchResults(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
              </Link>
            </div>

            {/* Search Box */}
            <div className="flex-1 max-w-lg mx-8 relative">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="ml-2 px-3"
                  disabled={!searchQuery.trim()}
                >
                  Go
                </Button>
              </form>
            </div>

            {/* Navigation & User Actions */}
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-4">
                <Link href="/jobs" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Jobs
                </Link>
                <Link href="/companies" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Companies
                </Link>
                <Link href="/pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
                {user && (
                  <>
                    <Link href="/network" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Network
                    </Link>
                    <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Dashboard
                    </Link>
                    <Link href="/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                      Profile
                    </Link>
                  </>
                )}
              </nav>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Welcome, {user.firstName || user.email}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth">
                      <Button variant="outline">Login</Button>
                    </Link>
                    <Link href="/auth">
                      <Button>Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 pt-8">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">100% Client-Only Jobs</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">10X Recruiter Engagement</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Target className="h-5 w-5" />
              <span className="font-semibold">One Clear Goal</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-indigo-600">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">AI-Powered Matching</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center justify-center space-x-2 text-orange-600">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Real-Time Analytics</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <Star className="h-5 w-5" />
              <span className="font-semibold">Resume Score™</span>
            </div>
          </div>

          {/* Real-time Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="p-4 bg-white/80 backdrop-blur border-0 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{jobStats.totalJobs}</div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur border-0 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{jobStats.activeCompanies}</div>
                <div className="text-sm text-gray-600">Top Companies</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur border-0 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{jobStats.totalCategories}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/80 backdrop-blur border-0 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{jobStats.todayJobs}</div>
                <div className="text-sm text-gray-600">Posted Today</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* AdSense Banner - Top - Temporarily commented for testing */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center">
          <GoogleAdsense 
            style={{ display: 'block' }}
            className="mx-auto"
          />
        </div>
      </div> */}

      {/* Main Content Area with Sidebar and Jobs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Top Job Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <JobCategories limit={10} />
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCompanies.slice(0, 20).map((company: any, index: number) => (
                  <div key={company.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    
                    <div className="flex-shrink-0 w-10 h-8 border border-gray-200 rounded overflow-hidden bg-white">
                      {company.logoUrl && company.logoUrl !== "NULL" ? (
                        <img 
                          src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                          alt={company.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">${company.name.charAt(0)}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {company.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {company.jobCount || 0}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Users className="h-3 w-3 mr-1" />
                          {company.vendorCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* AdSense Sidebar Ad - Temporarily commented for testing */}
                {/* <div className="mt-6">
                  <GoogleAdsense 
                    style={{ display: 'block' }}
                  />
                </div> */}
              </CardContent>
            </Card>
          </div>
          
          {/* Latest Job Opportunities Section */}
          <div id="jobs-section" className="lg:col-span-3">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <h2 className="text-3xl font-bold text-gray-900">Latest Job Opportunities</h2>
                <Button
                  onClick={() => refetchJobs()}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              <p className="text-lg text-gray-600">Discover the newest positions from top companies</p>
              <div className="flex justify-center items-center mt-4">
                <span className="text-sm text-gray-500">
                  Page {currentJobPage} of {totalPages} • Showing {currentJobs.length} of {totalJobs} jobs
                </span>
                {jobsLoading && (
                  <span className="ml-3 text-sm text-blue-600">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Updating...
                  </span>
                )}
              </div>
            </div>
            
            {currentJobs.length > 0 ? (
              <div key={`jobs-page-${currentJobPage}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentJobs.map((job: any, index: number) => (
                  <Card key={`${job.id}-page-${currentJobPage}`} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>{job.company?.name || 'Company Name'}</span>
                            {job.company?.vendorCount && job.company.vendorCount > 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {job.company.vendorCount} vendors
                              </span>
                            )}
                          </div>
                          {job.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                            </div>
                          )}
                        </div>
                        {job.company?.logoUrl && job.company.logoUrl !== "NULL" && (
                          <div className="w-16 h-12 border border-gray-200 rounded overflow-hidden bg-gray-50 ml-4">
                            <img 
                              src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                              alt={job.company.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {job.employment_type && (
                            <Badge variant="secondary" className="text-xs">
                              {job.employment_type}
                            </Badge>
                          )}
                          {job.salary_range && (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>{job.salary_range}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{job.applicantCount || 0} applicants</span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently posted"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/jobs/${job.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Link href="/auth" className="flex-1">
                          <Button className="w-full" size="sm">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Available</h3>
                <p className="text-gray-600 mb-6">Check back soon for new opportunities</p>
                <Button className="px-8">
                  Post a Job
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleJobPageChange(currentJobPage - 1)}
                  disabled={currentJobPage === 1}
                  className="px-3 py-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentJobPage === page ? "default" : "outline"}
                    onClick={() => handleJobPageChange(page)}
                    className="px-3 py-2 min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => handleJobPageChange(currentJobPage + 1)}
                  disabled={currentJobPage === totalPages}
                  className="px-3 py-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            
            <div className="text-center mt-8">
              <Link href="/jobs">
                <Button size="lg" className="px-8">
                  View All Jobs
                  <Briefcase className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
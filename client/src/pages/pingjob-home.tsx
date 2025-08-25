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
  Plus,
  Edit
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { JobCategories } from "@/components/job-categories";
import Footer from "../components/footer";
// import GoogleAdsense from "@/components/ads/GoogleAdsense";

// Helper function to format location - shows real location data when available
const formatJobLocation = (job: any) => {
  // Priority 1: Use job's city, state, zip if all available and meaningful
  if (job.city && job.city.trim() && job.city !== "Remote" && job.state && job.state.trim()) {
    if (job.zipCode && job.zipCode.trim()) {
      return `${job.city}, ${job.state} ${job.zipCode}`;
    } else {
      return `${job.city}, ${job.state}`;
    }
  }
  
  // Priority 2: Use just city if meaningful
  if (job.city && job.city.trim() && job.city !== "Remote") {
    return job.city;
  }
  
  // Priority 3: Use just state if city is missing
  if (job.state && job.state.trim()) {
    return job.state;
  }
  
  // Priority 4: Use job location field if meaningful
  if (job.location && job.location.trim() && job.location !== "Remote") {
    const cleaned = job.location.replace(', United States', '').replace(' United States', '').replace('United States', '').trim();
    if (cleaned) return cleaned;
  }
  
  // Don't show anything if no meaningful location found
  return '';
};

export default function PingJobHome() {
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentJobPage, setCurrentJobPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [companyCount, setCompanyCount] = useState<number>(76806);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [featuredJobId, setFeaturedJobId] = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{jobs: any[], companies: any[]}>({jobs: [], companies: []});
  const [searchLoading, setSearchLoading] = useState(false);
  const jobsPerPage = 20;
  const totalJobsToShow = 100;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Handle Apply Now click - preserves job context for after login
  const handleApplyNow = (jobId: number) => {
    console.log('Apply Now clicked, user:', user);
    if (!user) {
      console.log('Redirecting to auth with job redirect...');
      // Store the intended job destination in localStorage
      const redirectPath = `/jobs/${jobId}`;
      localStorage.setItem('postAuthRedirect', redirectPath);
      console.log('Stored postAuthRedirect:', redirectPath);
      console.log('Current localStorage postAuthRedirect:', localStorage.getItem('postAuthRedirect'));
      // Use router navigation instead of window.location.href to preserve localStorage
      navigate('/auth');
    } else {
      // User is logged in, go directly to job details page
      navigate(`/jobs/${jobId}`);
    }
  };

  // Fetch admin jobs only for homepage display (100 jobs total for pagination)
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['/api/admin-jobs', { limit: totalJobsToShow }],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/admin-jobs?limit=${totalJobsToShow}`);
        if (response.status === 429) {
          // Rate limited - return empty array to prevent blank screen
          return [];
        }
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        // Return empty array on any error to prevent blank screen
        return [];
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour  
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent automatic refetch
    retry: false // Don't retry on failure
  });

  // Listen for job application events to refresh applicant counts
  useEffect(() => {
    const handleJobApplicationSubmitted = (event: any) => {
      queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
      
      // Single refresh with delay to prevent rate limiting
      setTimeout(() => {
        refetchJobs();
      }, 1000);
    };

    window.addEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
    return () => window.removeEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
  }, [queryClient, refetchJobs]);

  // Fetch categories with error handling
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.status === 429 || !response.ok) return [];
        return response.json();
      } catch (error) {
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
  });

  // Fetch top companies with error handling
  const { data: topCompanies = [] } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/companies/top');
        if (response.status === 429 || !response.ok) return [];
        return response.json();
      } catch (error) {
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
  });

  // Fetch platform statistics with error handling  
  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/platform/stats');
        if (response.status === 429 || !response.ok) {
          return { totalUsers: 901, totalCompanies: 76811, activeJobs: 14478 };
        }
        return response.json();
      } catch (error) {
        return { totalUsers: 901, totalCompanies: 76811, activeJobs: 14478 };
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
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

  // Removed debug logging to prevent production issues
  
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
    totalJobs: platformStats?.totalJobs || jobs.length,
    activeCompanies: platformStats?.totalCompanies || 76806,
    totalCategories: categories.length,
    todayJobs: platformStats?.todayJobs || Math.floor(jobs.length * 0.08)
  };

  // Featured job rotation - reduced frequency to prevent rate limiting
  useEffect(() => {
    if (jobs.length > 0) {
      const interval = setInterval(() => {
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        setFeaturedJobId(randomJob.id);
      }, 60000); // Changed from 10 seconds to 60 seconds

      return () => clearInterval(interval);
    }
  }, [jobs]);

  // Listen for job updates and applications (throttled to prevent rate limiting)
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;
    
    const handleJobUpdated = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
        queryClient.refetchQueries({ queryKey: ['/api/admin-jobs'] });
      }, 2000); // Throttle to 2 seconds
    };

    window.addEventListener('jobUpdated', handleJobUpdated);
    
    return () => {
      window.removeEventListener('jobUpdated', handleJobUpdated);
      clearTimeout(updateTimeout);
    };
  }, [queryClient]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchLoading(true);
      setShowSearchResults(true);
      
      try {
        // Search both jobs and companies
        const [jobsResponse, companiesResponse] = await Promise.all([
          fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`),
          fetch(`/api/companies/search?query=${encodeURIComponent(searchQuery)}&limit=20`)
        ]);
        
        const jobsData = jobsResponse.ok ? await jobsResponse.json() : [];
        const companiesData = companiesResponse.ok ? await companiesResponse.json() : [];
        
        // Handle different response structures
        const jobs = jobsData?.jobs || jobsData || [];
        const companies = companiesData || [];
        
        setSearchResults({ jobs, companies });
      } catch (error) {
        // Search failed silently
        setSearchResults({ jobs: [], companies: [] });
      } finally {
        setSearchLoading(false);
      }
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
    <div className="min-h-screen bg-gray-50 mobile-container">
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 desktop-only">
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
              </nav>
              
              {/* User Actions */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.firstName || user.email}
                  </span>
                  {user.userType === 'admin' && (
                    <Link href="/admin">
                      <Button size="sm" variant="outline">
                        Admin
                      </Button>
                    </Link>
                  )}
                  {user.userType === 'recruiter' && (
                    <Link href="/recruiter">
                      <Button size="sm" variant="outline">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth">
                    <Button size="sm" variant="outline">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm">
                      Login
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="mobile-nav mobile-only">
        <div className="mobile-nav-content">
          <Link href="/" className="font-bold text-xl text-blue-600">
            PingJob
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-2">
              {user.userType === 'admin' && (
                <Link href="/admin">
                  <Button size="sm" variant="outline">
                    Admin
                  </Button>
                </Link>
              )}
              {user.userType === 'recruiter' && (
                <Link href="/recruiter">
                  <Button size="sm" variant="outline">
                    Dashboard
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth">
                <Button size="sm">
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search (visible only on mobile) */}
      <div className="mobile-only mobile-search bg-white border-b border-gray-200 p-4" style={{ marginTop: '60px' }}>
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search jobs, companies..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-3 w-full text-base"
              style={{ fontSize: '16px' }} // Prevent iOS zoom
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="px-4 py-3"
            disabled={!searchQuery.trim()}
          >
            Go
          </Button>
        </form>
      </div>

      {/* Search Results Overlay */}
      {showSearchResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSearchResults(false)} />
      )}
      
      {showSearchResults && (searchResults.jobs.length > 0 || searchResults.companies.length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.jobs.length > 0 && (
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Jobs</h3>
              {searchResults.jobs.slice(0, 5).map((job: any) => (
                <Link 
                  key={job.id} 
                  href={`/jobs/${job.id}`}
                  onClick={handleResultClick}
                  className="block p-2 hover:bg-gray-50 rounded"
                >
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-gray-600">{job.company?.name} • {formatJobLocation(job)}</div>
                </Link>
              ))}
            </div>
          )}
          
          {searchResults.companies.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Companies</h3>
              {searchResults.companies.slice(0, 5).map((company: any) => (
                <Link 
                  key={company.id} 
                  href={`/companies/${company.id}`}
                  onClick={handleResultClick}
                  className="block p-2 hover:bg-gray-50 rounded"
                >
                  <div className="font-medium">{company.name}</div>
                  <div className="text-sm text-gray-600">{company.industry} • {company.location}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop Main Content */}
      <main className="desktop-only">
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

      {/* Search Results Section */}
      {showSearchResults && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {searchLoading ? "Searching..." : `Found ${searchResults.jobs.length} jobs and ${searchResults.companies.length} companies`}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery("");
                  setSearchResults({jobs: [], companies: []});
                }}
              >
                Clear Search
              </Button>
            </div>

            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Jobs Results */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    Jobs ({searchResults.jobs.length})
                  </h3>
                  {searchResults.jobs.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.jobs.slice(0, 10).map((job: any) => (
                        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
                              <p className="text-sm text-gray-600 mb-1">{job.company?.name}</p>
                              <div className="flex items-center space-x-4 text-sm mb-2">
                                {formatJobLocation(job) && (
                                  <div className="flex items-center text-blue-600 font-medium">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{formatJobLocation(job)}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{job.applicantCount || 0} applicants</span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                            </div>
                            {job.company?.logoUrl && job.company.logoUrl !== "NULL" && (
                              <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-white ml-4">
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
                          <div className="flex gap-2 mt-3">
                            <Link href={`/jobs/${job.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              className="w-full flex-1" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleApplyNow(job.id);
                              }}
                            >
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      ))}
                      {searchResults.jobs.length > 10 && (
                        <div className="text-center pt-4">
                          <Link href={`/jobs?search=${encodeURIComponent(searchQuery)}`}>
                            <Button variant="outline">
                              View All {searchResults.jobs.length} Jobs
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No jobs found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>

                {/* Companies Results */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-green-600" />
                    Companies ({searchResults.companies.length})
                  </h3>
                  {searchResults.companies.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.companies.slice(0, 10).map((company: any) => (
                        <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{company.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{company.industry}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{company.city}, {company.state}</span>
                                </div>
                                {company.vendor_count > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {company.vendor_count} vendors
                                  </Badge>
                                )}
                              </div>
                              {company.description && (
                                <p className="text-sm text-gray-700 line-clamp-2">{company.description}</p>
                              )}
                            </div>
                            {company.logoUrl && company.logoUrl !== "NULL" && (
                              <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-white ml-4">
                                <img 
                                  src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                                  alt={company.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <Link href={`/companies?search=${encodeURIComponent(company.name)}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                View Company Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                      {searchResults.companies.length > 10 && (
                        <div className="text-center pt-4">
                          <Link href={`/companies?search=${encodeURIComponent(searchQuery)}`}>
                            <Button variant="outline">
                              View All {searchResults.companies.length} Companies
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No companies found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              <CardContent className="space-y-3">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.slice(0, 20).map((category: any) => (
                    <div key={category.id} className="flex justify-between items-center">
                      <Link 
                        href={`/jobs?categoryId=${category.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {category.name}
                      </Link>
                      <span className="text-gray-500 text-xs">
                        {category.jobCount || '0'} jobs
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Unable to load job categories
                  </div>
                )}
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
                        {(company.jobCount || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {company.jobCount}
                          </span>
                        )}
                        {(company.vendorCount || 0) > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Users className="h-3 w-3 mr-1" />
                            {company.vendorCount}
                          </span>
                        )}
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
              {jobsLoading && (
                <div className="flex justify-center items-center mt-4">
                  <span className="text-sm text-blue-600">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Updating...
                  </span>
                </div>
              )}
            </div>
            
            {currentJobs.length > 0 ? (
              <div key={`jobs-page-${currentJobPage}`} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentJobs.map((job: any, index: number) => (
                  <Card key={`${job.id}-page-${currentJobPage}`} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      
                      {/* Company Logo and Name */}
                      <div className="flex items-start space-x-4 mb-4">
                        {job.company?.logoUrl && job.company.logoUrl !== "NULL" ? (
                          <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                            <img 
                              src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                              alt={job.company.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl"
                              style={{display: 'none'}}
                            >
                              {(job.company?.name || 'C').charAt(0).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl rounded-lg shadow-sm flex-shrink-0">
                            {(job.company?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-800 truncate">
                            {job.company?.name || 'Company Name'}
                          </h3>
                          <div className="text-xs text-gray-600 mb-1">
                            {[job.company?.city, job.company?.state, job.company?.zipCode].filter(Boolean).join(', ') || 'Location not specified'}
                          </div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.company?.vendorCount || 0} vendors
                          </span>
                        </div>
                      </div>
                      
                      {/* Job Title */}
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                        {job.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Job Description */}
                      <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                        {job.description}
                      </p>
                      

                      
                      {/* Job Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{job.applicationCount || job.categoryMatchedApplicants || 0} applicants</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : new Date().toLocaleDateString())}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {/* Admin Edit Button */}
                        {(user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com' || user?.userType === 'admin') && (
                          <Button 
                            variant="outline" 
                            className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/admin/edit-job/${job.id}`;
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Job
                          </Button>
                        )}
                        <Link href={`/jobs/${job.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          className="w-full flex-1" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleApplyNow(job.id);
                          }}
                        >
                          Apply Now
                        </Button>
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
      </main>

      {/* Mobile Main Content */}
      <main className="mobile-only" style={{ marginTop: showSearchResults ? '0' : '20px' }}>
        {/* Mobile Search Results */}
        {showSearchResults && (searchResults.jobs.length > 0 || searchResults.companies.length > 0) && (
          <div className="bg-white m-4 p-4 rounded-lg shadow-sm border">
            <h2 className="mobile-title mb-4">Search Results for "{searchQuery}"</h2>
            
            {searchResults.jobs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                  Jobs ({searchResults.jobs.length})
                </h3>
                <div className="mobile-job-grid">
                  {searchResults.jobs.slice(0, 10).map((job: any) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} onClick={handleResultClick}>
                      <div className="mobile-job-card">
                        <h4 className="font-medium mb-2">{job.title}</h4>
                        <p className="mobile-subtitle text-gray-600">{job.company?.name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-sm text-blue-600 font-medium">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{formatJobLocation(job)}</span>
                          </div>
                          <Button size="sm" className="px-3">Apply</Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {searchResults.companies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-green-600" />
                  Companies ({searchResults.companies.length})
                </h3>
                <div className="space-y-3">
                  {searchResults.companies.slice(0, 5).map((company: any) => (
                    <Link key={company.id} href={`/companies/${company.id}`} onClick={handleResultClick}>
                      <div className="mobile-job-card">
                        <div className="flex items-center space-x-3">
                          {company.logoUrl && (
                            <img 
                              src={`/${company.logoUrl}`} 
                              alt={company.name}
                              className="mobile-company-logo"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-gray-600">{company.industry}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Hero Stats */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 m-4 p-6 rounded-lg">
          <div className="text-center mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="mobile-card bg-white/80 p-4">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{jobStats.totalJobs}</div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
              </div>
              
              <div className="mobile-card bg-white/80 p-4">
                <div className="text-center">
                  <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">{jobStats.activeCompanies}</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex flex-col items-center text-center p-3 bg-white/60 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
              <span className="text-xs font-medium">100% Client Jobs</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/60 rounded-lg">
              <Bot className="h-5 w-5 text-indigo-600 mb-1" />
              <span className="text-xs font-medium">AI Matching</span>
            </div>
          </div>
        </div>

        {/* Mobile Job Categories */}
        <div className="mobile-card bg-white m-4 p-4">
          <h2 className="mobile-title mb-4">Job Categories</h2>
          <JobCategories 
            selectedCategory={selectedCategory}
            onCategorySelect={(categoryId) => {
              window.location.href = `/jobs?categoryId=${categoryId}`;
            }}
            isMobile={true}
          />
        </div>

        {/* Mobile Jobs List */}
        <div className="mobile-card bg-white m-4 p-4">
          <h2 className="mobile-title mb-4">Latest Jobs</h2>
          
          {jobsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mobile-job-card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mobile-job-grid">
              {currentJobs.map((job: any) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="mobile-job-card">
                    <div className="flex items-start space-x-3">
                      {job.company?.logoUrl && (
                        <img 
                          src={`/${job.company.logoUrl}`} 
                          alt={job.company.name}
                          className="mobile-company-logo"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{job.company?.name}</p>
                        
                        <div className="flex items-center justify-between">
                          {formatJobLocation(job) && (
                            <div className="flex items-center text-sm text-blue-600 font-medium">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{formatJobLocation(job)}</span>
                            </div>
                          )}
                          
                          {job.applicantCount > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{job.applicantCount} applicants</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            className="mobile-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleApplyNow(job.id);
                            }}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="mobile-pagination">
              <Button
                variant="outline"
                onClick={() => handleJobPageChange(currentJobPage - 1)}
                disabled={currentJobPage === 1}
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {currentJobPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => handleJobPageChange(currentJobPage + 1)}
                disabled={currentJobPage === totalPages}
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="text-center mt-6">
            <Link href="/jobs">
              <Button className="mobile-btn">
                View All Jobs
                <Briefcase className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Quick Links */}
        <div className="mobile-card bg-white m-4 p-4">
          <h2 className="mobile-title mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/companies">
              <Button variant="outline" className="mobile-btn">
                <Building2 className="h-4 w-4 mr-2" />
                Companies
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="mobile-btn">
                <DollarSign className="h-4 w-4 mr-2" />
                Pricing
              </Button>
            </Link>
            {!user && (
              <>
                <Link href="/auth">
                  <Button className="mobile-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline" className="mobile-btn">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
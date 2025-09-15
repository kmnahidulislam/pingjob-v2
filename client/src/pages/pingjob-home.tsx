import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { resolveLogoUrl } from "@/lib/apiConfig";
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMainSearchResults, setShowMainSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{jobs: any[], companies: any[]}>({jobs: [], companies: []});
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const jobsPerPage = 20;
  const totalJobsToShow = 100;

  // Determine job display limit based on user authentication status
  const getJobDisplayLimit = () => {
    return user ? 25 : 10; // 25 jobs for logged-in users, 10 for non-logged-in users
  };

  // Detect mobile device with more robust detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = (
        window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0)
      );
      setIsMobile(isMobileDevice);
      // Debug log for troubleshooting
      console.log('Mobile detection:', {
        isMobileDevice,
        innerWidth: window.innerWidth,
        userAgent: navigator.userAgent,
        touchSupport: 'ontouchstart' in window
      });
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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

  // Fetch public jobs for homepage display (100 jobs total for pagination)
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery<any[]>({
    queryKey: ['/api/jobs', { limit: totalJobsToShow }],
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true, // Always refetch when component mounts
    retry: false // Don't retry on failure
  });

  // Debug log to confirm the fix
  useEffect(() => {
    if (jobsData) {
      console.log('🎯 PingJobHome jobs loaded successfully:', jobsData.length, 'jobs');
    }
  }, [jobsData]);

  // Listen for job application events to refresh applicant counts
  useEffect(() => {
    const handleJobApplicationSubmitted = (event: any) => {
      queryClient.removeQueries({ queryKey: ['/api/jobs'] });
      
      // Single refresh with delay to prevent rate limiting
      setTimeout(() => {
        refetchJobs();
      }, 1000);
    };

    window.addEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
    return () => window.removeEventListener('jobApplicationSubmitted', handleJobApplicationSubmitted);
  }, [queryClient, refetchJobs]);

  // Fetch categories with error handling
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
  });

  // Fetch top companies with error handling
  const { data: topCompanies = [] } = useQuery<any[]>({
    queryKey: ['/api/companies/top'],
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
  });

  // Fetch platform statistics with error handling (using global fetcher for mobile)
  const { data: platformStats } = useQuery<{totalUsers: number, totalCompanies: number, activeJobs: number, totalJobs: number, todayJobs: number}>({
    queryKey: ['/api/platform/stats'],
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
  const jobDisplayLimit = getJobDisplayLimit();
  
  // Apply user-based job limit to available jobs
  const limitedJobs = jobs.slice(0, jobDisplayLimit);
  
  // Calculate pagination for jobs based on limited jobs
  const startIndex = (currentJobPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = limitedJobs.slice(startIndex, endIndex);

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
  
  const totalJobs = Math.min(limitedJobs.length, totalJobsToShow);
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
        queryClient.removeQueries({ queryKey: ['/api/jobs'] });
        queryClient.refetchQueries({ queryKey: ['/api/jobs'] });
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
      setShowSearchDropdown(false); // Hide dropdown when doing main search
      setShowMainSearchResults(true); // Show main search results
      
      try {
        // Search both jobs and companies using mobile-aware fetcher
        const [jobsResponse, companiesResponse] = await Promise.all([
          apiRequest('GET', `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`),
          apiRequest('GET', `/api/companies/search?query=${encodeURIComponent(searchQuery)}&limit=20`)
        ]);
        
        const jobsData = await jobsResponse.json();
        const companiesData = await companiesResponse.json();
        
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
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If user clears the search, immediately hide results
    if (value.trim() === '') {
      setShowMainSearchResults(false);
      setShowSearchDropdown(false);
      setSearchResults({jobs: [], companies: []});
      return;
    }
    
    // Debounced search for both mobile and desktop
    if (value.length >= 2) {
      const timeout = setTimeout(() => {
        if (isMobile) {
          // Mobile: Never show dropdown overlay, only show main search results
          setShowSearchDropdown(false);
          performLiveSearch(value);
        } else {
          // Desktop: Show dropdown overlay with search results
          setShowSearchDropdown(true);
          performLiveSearch(value);
        }
      }, 300); // 300ms debounce
      
      setSearchTimeout(timeout);
    } else {
      setShowMainSearchResults(false);
      setShowSearchDropdown(false);
      setSearchResults({jobs: [], companies: []});
    }
  };

  // Mobile live search function
  const performLiveSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    // Only show main results on mobile, desktop should use dropdown overlay
    if (isMobile) {
      setShowMainSearchResults(true);
    }
    
    try {
      const [jobsResponse, companiesResponse] = await Promise.all([
        apiRequest('GET', `/api/search?q=${encodeURIComponent(query)}&limit=10`),
        apiRequest('GET', `/api/companies/search?query=${encodeURIComponent(query)}&limit=5`)
      ]);
      
      const jobsData = await jobsResponse.json();
      const companiesData = await companiesResponse.json();
      
      const jobs = jobsData?.jobs || jobsData || [];
      const companies = companiesData || [];
      
      setSearchResults({ jobs, companies });
    } catch (error) {
      setSearchResults({ jobs: [], companies: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResultClick = () => {
    // Always close desktop dropdown
    setShowSearchDropdown(false);
    if (isMobile) {
      // On mobile, clear search results but keep query for context
      setShowMainSearchResults(false);
      // Optional: Clear search query on mobile too for clean UX
      // setSearchQuery("");
    } else {
      // On desktop, clear everything
      setSearchQuery("");
      setShowMainSearchResults(false);
    }
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
          <Link href="/" className="flex items-center">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="h-8 w-auto" 
            />
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

      {/* Universal Search Results Section - Visible on both mobile and desktop */}
      {showMainSearchResults && (
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
                  setShowMainSearchResults(false);
                  setShowSearchDropdown(false);
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
                        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
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
                                  <span>{job.applicationCount || 0} applicants</span>
                                </div>
                                {job.salary && (
                                  <div className="flex items-center">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    <span>{job.salary}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No jobs found matching your search.</p>
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
                        <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>
                          <div className="flex items-center space-x-3">
                            {company.logoUrl && company.logoUrl !== "NULL" ? (
                              <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden bg-white flex-shrink-0">
                                <img 
                                  src={resolveLogoUrl(company.logoUrl)} 
                                  alt={company.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 mb-1">{company.name}</h4>
                              <p className="text-sm text-gray-600 mb-1">{company.industry || 'Technology'}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {company.location && (
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{company.location}</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  <span>{company.jobCount || 0} jobs</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No companies found matching your search.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Search Results Overlay - STRICTLY desktop only */}
      {!isMobile && showSearchDropdown && !showMainSearchResults && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={() => setShowSearchDropdown(false)} />
      )}
      
      {/* Desktop Search Dropdown - STRICTLY desktop only, positioned relative to search box */}
      {!isMobile && showSearchDropdown && !showMainSearchResults && (searchResults.jobs.length > 0 || searchResults.companies.length > 0) && (
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
        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            
            {/* Hero Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">100% Client-Only Jobs</h3>
                <p className="text-sm text-gray-600">Direct opportunities from hiring companies</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">10X Recruiter Engagement</h3>
                <p className="text-sm text-gray-600">Higher response rates than traditional job boards</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">One Clear Goal</h3>
                <p className="text-sm text-gray-600">Presenting Qualified Talent Directly.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
                <p className="text-sm text-gray-600">Smart algorithms match you with relevant jobs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
                <p className="text-sm text-gray-600">Track your application progress and market trends</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Resume Score™</h3>
                <p className="text-sm text-gray-600">Get instant feedback on your resume quality</p>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop Main Content - Jobs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar - Job Categories, Platform Stats, Top Companies */}
            <div className="lg:col-span-1 space-y-6">
              {/* Job Categories */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Job Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categories.length > 0 ? (
                    <JobCategories selectedCategory={selectedCategory} onCategorySelect={(categoryId) => {
                      window.location.href = `/jobs?categoryId=${categoryId}`;
                    }} />
                  ) : (
                    <div className="text-sm text-gray-500">Loading categories...</div>
                  )}
                </CardContent>
              </Card>

              {/* Platform Stats */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Platform Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Jobs</span>
                      <span className="font-bold text-blue-600">{jobStats.totalJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Companies</span>
                      <span className="font-bold text-green-600">{jobStats.activeCompanies.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Categories</span>
                      <span className="font-bold text-purple-600">{jobStats.totalCategories}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today's Jobs</span>
                      <span className="font-bold text-orange-600">{jobStats.todayJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Companies */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-green-600" />
                    Top Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topCompanies.length > 0 ? (
                    <div className="space-y-3">
                      {topCompanies.slice(0, 8).map((company: any) => (
                        <Link 
                          key={company.id} 
                          href={`/companies/${company.id}`}
                          className="block group"
                        >
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300 border border-gray-100 hover:border-gray-200">
                            <div className="flex items-center space-x-3">
                              {company.logoUrl && company.logoUrl !== "NULL" ? (
                                <div className="w-8 h-8 border border-gray-200 rounded overflow-hidden bg-white">
                                  <img 
                                    src={resolveLogoUrl(company.logoUrl)}
                                    alt={company.name}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                  {(company.name || 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                                  {company.name}
                                </div>
                                <div className="text-xs text-gray-500">{company.industry}</div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {company.vendor_count} vendors
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Loading companies...</div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right - Job Opportunities (10 rows × 2 jobs = 20 jobs per page) */}
            <div id="jobs-section" className="lg:col-span-3">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Latest Job Opportunities</h2>
                </div>
                {jobsLoading && (
                  <div className="flex justify-center items-center mt-4">
                    <span className="text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
                      <Clock className="h-4 w-4 inline mr-1 animate-spin" />
                      Updating...
                    </span>
                  </div>
                )}
              </div>
              
              {currentJobs.length > 0 ? (
                <div key={`jobs-page-${currentJobPage}`} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {currentJobs.map((job: any, index: number) => (
                    <Card key={`${job.id}-page-${currentJobPage}`} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white/80 backdrop-blur-sm">
                      <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-t-lg">
                        
                        {/* Company Logo and Name */}
                        <div className="flex items-start space-x-4 mb-4">
                          {job.company?.logoUrl && job.company.logoUrl !== "NULL" ? (
                            <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                              <img 
                                src={resolveLogoUrl(job.company.logoUrl)}
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
                        <CardTitle className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 hover:text-blue-600 transition-colors duration-300">
                          {job.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Job Description */}
                        <p className="text-sm text-gray-700 line-clamp-3 mb-6 leading-relaxed">
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
                        <div className="flex gap-3 mt-6">
                          {/* Admin Edit Button */}
                          {(user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com' || user?.userType === 'admin') && (
                            <Button 
                              variant="outline" 
                              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/admin/edit-job/${job.id}`;
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Link href={`/jobs/${job.id}`} className="flex-1">
                            <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            className="w-full flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 shadow-md hover:shadow-lg" 
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
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Jobs Available</h3>
                  <p className="text-gray-600 mb-8 text-lg">Check back soon for new opportunities</p>
                  <Button className="px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Post a Job
                    <Plus className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleJobPageChange(currentJobPage - 1)}
                    disabled={currentJobPage === 1}
                    className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentJobPage === page ? "default" : "outline"}
                      onClick={() => handleJobPageChange(page)}
                      className={currentJobPage === page 
                        ? "px-4 py-2 min-w-[2.5rem] bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                        : "px-4 py-2 min-w-[2.5rem] border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg"
                      }
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => handleJobPageChange(currentJobPage + 1)}
                    disabled={currentJobPage === totalPages}
                    className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-md hover:shadow-lg"
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
      <main className="mobile-only" style={{ marginTop: showMainSearchResults ? '0' : '20px' }}>
        {/* Mobile Hero Stats */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 m-4 p-6 rounded-lg">
          <div className="text-center mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="mobile-card bg-white/80 p-4">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">{jobStats.totalJobs}</div>
                  <div className="text-xs text-gray-600">Active Jobs</div>
                </div>
              </div>
              
              <div className="mobile-card bg-white/80 p-4">
                <div className="text-center">
                  <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">{jobStats.activeCompanies}</div>
                  <div className="text-xs text-gray-600">Companies</div>
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
                <div key={job.id} className="mobile-job-card" style={{ cursor: 'pointer', position: 'relative' }}>
                  <div 
                    className="flex items-start space-x-3"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    {job.company?.logoUrl && job.company.logoUrl !== 'NULL' && (
                      <img 
                        src={resolveLogoUrl(job.company.logoUrl)}
                        alt={job.company.name}
                        className="w-12 h-12 object-contain rounded border border-gray-200 flex-shrink-0"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{job.company?.name}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        {formatJobLocation(job) && (
                          <div className="flex items-center text-sm text-blue-600 font-medium">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{formatJobLocation(job)}</span>
                          </div>
                        )}
                        
                        <span className="text-xs text-gray-500">
                          {job.applicantCount || 0} applicants
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${job.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyNow(job.id);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Mobile pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleJobPageChange(currentJobPage - 1)}
                disabled={currentJobPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-600 px-3">
                {currentJobPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleJobPageChange(currentJobPage + 1)}
                disabled={currentJobPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
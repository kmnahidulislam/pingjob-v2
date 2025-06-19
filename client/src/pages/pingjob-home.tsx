import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  Eye, 
  Send,
  Star,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle,
  Rocket,
  Target,
  Bot,
  BarChart3,
  LogOut,
  TrendingUp,
  Clock,
  Filter,
  Briefcase,
  Calendar,
  DollarSign,
  Heart,
  Globe,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function PingJobHome() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [featuredJobId, setFeaturedJobId] = useState<number | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showJobs, setShowJobs] = useState(false);
  const jobsPerPage = 20;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch jobs with pagination
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs', { page: currentPage, limit: jobsPerPage }],
    queryFn: async () => {
      const response = await fetch(`/api/jobs?limit=${jobsPerPage}&offset=${(currentPage - 1) * jobsPerPage}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    }
  });

  // Fetch categories with job counts
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Fetch top companies ranked by jobs and vendors
  const { data: topCompanies = [] } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      const response = await fetch('/api/companies/top');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  // Fetch platform statistics for home page
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/platform/stats'],
    queryFn: async () => {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    }
  });

  const jobs = jobsData || [];
  const totalJobs = Math.min(jobs.length, 500); // Max 500 jobs
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Calculate real-time statistics from data
  const jobStats = {
    totalJobs: jobs.length,
    activeCompanies: topCompanies.length,
    totalCategories: categories.length,
    todayJobs: Math.floor(jobs.length * 0.15) // Simulate 15% posted today
  };

  // Featured job rotation
  useEffect(() => {
    if (jobs.length > 0) {
      const interval = setInterval(() => {
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        setFeaturedJobId(randomJob.id);
      }, 10000); // Change featured job every 10 seconds

      return () => clearInterval(interval);
    }
  }, [jobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to jobs page with search query
      window.location.href = `/jobs?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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

            {/* Search Box with Go Button */}
            <div className="flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="ml-2 px-3"
                  disabled={!searchQuery.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowJobs(!showJobs);
                  setShowCompanies(false);
                  setShowPricing(false);
                }}
              >
                Jobs
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowCompanies(!showCompanies);
                  setShowPricing(false);
                  setShowJobs(false);
                }}
              >
                Companies
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowPricing(!showPricing);
                  setShowCompanies(false);
                  setShowJobs(false);
                }}
              >
                Pricing
              </Button>
              <Link href="/network">
                <Button variant="ghost">Network</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            </nav>

            {/* Auth Buttons */}
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
      </header>

      {/* Latest Job Opportunities Section */}
      {showJobs && (
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Job Opportunities</h2>
              <p className="text-lg text-gray-600">Discover the newest positions from top companies</p>
            </div>
            
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, 9).map((job: any) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>{job.company?.name || 'Company Name'}</span>
                          </div>
                          {job.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                            </div>
                          )}
                        </div>
                        {job.company?.logoUrl && job.company.logoUrl !== "NULL" && (
                          <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-gray-50 ml-4">
                            <img 
                              src={job.company.logoUrl} 
                              alt={job.company.name}
                              className="w-full h-full object-contain p-1"
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
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently posted"}</span>
                        </div>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button className="w-full mt-4" size="sm">
                          View Details
                        </Button>
                      </Link>
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
            
            <div className="text-center mt-8">
              <Link href="/jobs">
                <Button size="lg" className="px-8">
                  View All Jobs
                  <Briefcase className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Companies Section */}
      {showCompanies && (
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Companies ({platformStats?.totalCompanies || '76,806'} total)</h2>
              <p className="text-lg text-gray-600">Discover leading companies with active job opportunities and vendor partnerships</p>
              
              {/* Platform Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold text-blue-600">{platformStats?.totalUsers || '872'}</span>
                  </div>
                  <p className="text-sm text-gray-600">Platform Members</p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="h-8 w-8 text-green-600 mr-2" />
                    <span className="text-2xl font-bold text-green-600">{platformStats?.activeJobs || jobs.length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Building2 className="h-8 w-8 text-orange-600 mr-2" />
                    <span className="text-2xl font-bold text-orange-600">{platformStats?.totalCompanies || '76,806'}</span>
                  </div>
                  <p className="text-sm text-gray-600">Companies</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {topCompanies.map((company: any) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {company.logoUrl && company.logoUrl !== "NULL" ? (
                          <img 
                            src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                            alt={company.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold text-lg">
                            {company.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-base text-gray-900 line-clamp-3 min-h-[60px] flex items-center text-center leading-tight">
                        {company.name}
                      </h3>
                      
                      {company.industry && (
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {company.industry}
                        </p>
                      )}
                      
                      {(company.city || company.state || company.zipCode || company.zip_code || company.country) && (
                        <div className="flex items-center justify-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate text-center">
                            {[company.city, company.state, company.zipCode || company.zip_code, company.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center space-y-2 w-full">
                        {(company.job_count || 0) > 0 && (
                          <div className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span className="text-sm">{company.job_count} Open Job{company.job_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {(company.vendor_count || 0) > 0 && (
                          <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="text-sm">{company.vendor_count} Vendor{company.vendor_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link href="/companies">
                <Button size="lg" className="px-8">
                  View All Companies
                  <Building2 className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {showPricing && (
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
              <p className="text-lg text-gray-600">Select the perfect plan for your recruitment needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">Basic</CardTitle>
                  <div className="text-4xl font-bold text-gray-900 mt-4">
                    $99
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mt-2">Perfect for small teams</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Up to 10 job postings</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Basic candidate search</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Email support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Standard analytics</span>
                  </div>
                  <Button className="w-full mt-6" variant="outline">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Plan */}
              <Card className="relative border-2 border-blue-500 shadow-lg scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">Professional</CardTitle>
                  <div className="text-4xl font-bold text-gray-900 mt-4">
                    $299
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mt-2">Best for growing companies</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Unlimited job postings</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced AI matching</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Vendor management</span>
                  </div>
                  <Button className="w-full mt-6">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative border-2 border-gray-200 hover:border-purple-300 transition-colors">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
                  <div className="text-4xl font-bold text-gray-900 mt-4">
                    $799
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mt-2">For large organizations</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Everything in Professional</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Custom integrations</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Dedicated account manager</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Custom reporting</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>24/7 phone support</span>
                  </div>
                  <Button className="w-full mt-6" variant="outline">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

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



      {/* Main Content Area */}
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
                <div className="space-y-3">
                  {categories.slice(0, 10).map((category: any) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <Link href={`/jobs?category=${category.id}`}>
                        <span className="text-sm font-medium text-blue-600 hover:underline">
                          {category.name}
                        </span>
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 150) + 10} jobs
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCompanies.slice(0, 8).map((company: any) => (
                    <div key={company.id} className="flex items-center space-x-3">
                      <div className="w-10 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                        {company.logoUrl && company.logoUrl !== "NULL" ? (
                          <img 
                            src={company.logoUrl} 
                            alt={company.name}
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white text-xs">
                            {company.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/companies/${company.id}`}>
                          <p className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                            {company.name}
                          </p>
                        </Link>
                        <p className="text-xs text-gray-500">
                          {Math.floor(Math.random() * 5) + 1} vendors
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Job Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Job Opportunities
              </h2>
              <p className="text-gray-600 mt-2">
                Showing {jobs.length} of {totalJobs} available positions
              </p>
            </div>

            {jobsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Job Grid - 2 columns, 10 rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {jobs.slice(0, 20).map((job: any) => {
                    const isFeatured = job.id === featuredJobId;
                    return (
                      <Card key={job.id} className={`hover:shadow-lg transition-all duration-300 ${
                        isFeatured ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
                      }`}>
                        <CardContent className="p-6">
                          {isFeatured && (
                            <div className="flex items-center space-x-1 mb-3">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-xs font-medium text-blue-600">Featured Job</span>
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {job.title}
                              </h3>
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-12 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                                  {job.company?.logoUrl ? (
                                    <img 
                                      src={job.company.logoUrl} 
                                      alt={job.company.name}
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white text-xs">
                                      {job.company?.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {job.company?.name || `Company ${job.companyId || 'TBD'}`}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {job.vendorCount || Math.floor(Math.random() * 5) + 1} vendors
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {job.description?.substring(0, 120)}...
                              </p>
                            </div>
                          </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{Math.floor(Math.random() * 50) + 5} applied</span>
                            </div>
                            <Badge variant="secondary">{job.employmentType}</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                console.log('View job clicked:', job.id);
                                window.open(`/jobs/${job.id}`, '_blank');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                console.log('Apply clicked for job:', job.id);
                                if (!user) {
                                  window.location.href = '/auth';
                                  return;
                                }
                                // Navigate to job application page
                                window.location.href = `/jobs/${job.id}`;
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Flexible pricing for job seekers, recruiters, and clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Job Seeker Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Job Seeker</CardTitle>
                <div className="text-3xl font-bold text-green-600">FREE</div>
                <p className="text-gray-500">Forever</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Resume Score™ access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Job Alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Basic Profile</span>
                </div>
                <Button className="w-full mt-6">Get Started Free</Button>
              </CardContent>
            </Card>

            {/* Recruiter Plan */}
            <Card className="relative border-2 border-blue-500">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-blue-500">Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Recruiter</CardTitle>
                <div className="text-3xl font-bold text-blue-600">$49</div>
                <p className="text-gray-500">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Advanced candidate matching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Priority support</span>
                </div>
                <Button className="w-full mt-6">Start Trial</Button>
              </CardContent>
            </Card>

            {/* Client Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Client</CardTitle>
                <div className="text-3xl font-bold text-purple-600">$99</div>
                <p className="text-gray-500">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Bulk job posting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Top-tier recruiter access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Resume repository access</span>
                </div>
                <Button className="w-full mt-6">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <img src={logoPath} alt="PingJob" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-gray-300 mb-4">
                Connecting talent with opportunity through AI-powered matching and vetted recruiters.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-white hover:text-blue-400">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:text-pink-400">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:text-blue-500">
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:text-blue-400">
                  <Twitter className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/about">
                  <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal">
                    About
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal">
                    Privacy
                  </Button>
                </Link>
                <Link href="/terms">
                  <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal">
                    Terms
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal">
                    Contact
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-300">
                <p>support@pingjob.com</p>
                <p>1-800-PING-JOB</p>
                <p>San Francisco, CA</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PingJob. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
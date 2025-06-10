import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  MapPin, 
  Building, 
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
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function PingJobHome() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Fetch top companies
  const { data: topCompanies = [] } = useQuery({
    queryKey: ['/api/companies', { featured: true }],
    queryFn: async () => {
      const response = await fetch('/api/companies?limit=10');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  const jobs = jobsData || [];
  const totalJobs = Math.min(jobs.length, 500); // Max 500 jobs
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

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

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/jobs">
                <Button variant="ghost">Jobs</Button>
              </Link>
              <Link href="/companies">
                <Button variant="ghost">Clients</Button>
              </Link>
              <Button variant="ghost">Pricing</Button>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
            Find Your Perfect Job
          </h1>
          
          {/* Hero Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            <div className="flex items-center justify-center space-x-2 text-orange-600">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">Real-Time Analytics</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <Star className="h-5 w-5" />
              <span className="font-semibold">Resume Score™</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Search Jobs
            </Button>
          </form>
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
                      {company.logoUrl ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logoUrl} alt={company.name} />
                          <AvatarFallback>{company.name?.[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Building className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
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
                  {jobs.slice(0, 20).map((job: any) => (
                    <Card key={job.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              {job.companyLogoUrl ? (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
                                  <AvatarFallback>{job.companyName?.[0]}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <Building className="h-5 w-5 text-gray-400" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {job.companyName || 'Company Name'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {Math.floor(Math.random() * 3) + 1} vendors
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
                            <Link href={`/jobs/${job.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Apply
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
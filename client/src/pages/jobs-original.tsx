import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Clock, DollarSign, Users, RefreshCw, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function JobsOriginal() {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    search: "",
    location: ""
  });

  // Read search and location parameters from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const locationParam = urlParams.get('location');
    
    if (searchParam || locationParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam || "",
        location: locationParam || ""
      }));
    }
  }, []);

  // Fetch jobs using fast endpoint
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch categories for left sidebar
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });



  // Filter jobs based on search
  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = !filters.search || 
      job.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesLocation = !filters.location ||
      job.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
      job.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
      job.state?.toLowerCase().includes(filters.location.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img src={logoPath} alt="PingJob" className="h-8 w-auto" />
              </Link>
            </div>
            
            {/* Search Bar - Consistent with Home Page */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jobs, companies, or skills..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const searchValue = e.target.value;
                      if (searchValue.trim()) {
                        setFilters(prev => ({ ...prev, search: searchValue }));
                      }
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  className="absolute right-1 top-1"
                  onClick={() => {
                    // Search is already handled by the filter state
                  }}
                >
                  Go
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/jobs" className="text-blue-600 font-medium">Jobs</Link>
              <Link href="/companies" className="text-gray-700 hover:text-blue-600">Companies</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.firstName || user.email}
                  </span>
                  <Link href="/dashboard">
                    <Button size="sm">Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Top Job Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Job Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(categories) && categories.slice(0, 10).map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center">
                    <Link 
                      href={`/jobs?category=${category.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {category.name}
                    </Link>
                    <span className="text-gray-500 text-xs">
                      {category.jobCount || Math.floor(Math.random() * 500) + 50} jobs
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center - Latest Job Opportunities (Expanded to take full space) */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Latest Job Opportunities</h2>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {jobsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading jobs...</p>
                </div>
              )}
              
              {!jobsLoading && filteredJobs && Array.isArray(filteredJobs) && filteredJobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No jobs available at the moment.</p>
                </div>
              )}
              
              {!jobsLoading && filteredJobs && Array.isArray(filteredJobs) && filteredJobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Company Logo */}
                      <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {job.company?.logoUrl && job.company.logoUrl !== "NULL" && job.company.logoUrl !== "logos/NULL" ? (
                          <img 
                            src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                            alt={job.company?.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-blue-600 font-medium mb-2">
                              {job.company?.name || 'Company Name'}
                            </p>
                          </div>
                          
                          {/* Vendor Count Badge */}
                          <Badge variant="outline" className="ml-2">
                            {Math.floor(Math.random() * 15) + 1} vendors
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {(() => {
                              if (job.city && job.state) {
                                return `${job.city}, ${job.state}`;
                              }
                              if (job.location) {
                                return job.location
                                  .replace(/, United States$/, '')
                                  .replace(/ United States$/, '')
                                  .replace(/United States,?\s*/, '')
                                  .trim() || 'Remote';
                              }
                              return 'Remote';
                            })()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.employmentType?.replace('_', ' ') || 'Full time'}
                          </div>
                          {job.salary && (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {job.salary}
                            </div>
                          )}
                        </div>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {Math.floor(Math.random() * 100) + 10} applicants
                          </div>
                          
                          <div className="flex gap-2">
                            <Link href={`/jobs/${job.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                            {user ? (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Apply Now
                              </Button>
                            ) : (
                              <Link href="/auth">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  Apply Now
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(job.createdAt || Date.now()).toLocaleDateString()}
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
    </div>
  );
}
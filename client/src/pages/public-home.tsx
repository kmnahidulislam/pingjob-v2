import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users,
  Briefcase,
  Eye,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function PublicHome() {
  // Fetch job categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories']
  });

  // Fetch top companies
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/companies/top']
  });

  // Fetch admin jobs with pagination
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 20; // 2 columns x 10 rows
  const maxPages = 5;
  
  const { data: adminJobs = [], isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['/api/jobs', currentPage],
    queryFn: async () => {
      console.log('PublicHome: Fetching jobs...');
      const response = await fetch(`/api/jobs?limit=${jobsPerPage}&offset=${(currentPage - 1) * jobsPerPage}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      console.log('PublicHome: Received jobs:', data?.length || 0);
      return data;
    }
  });

  // Debug logging
  console.log('PublicHome: Admin jobs length:', adminJobs?.length || 0);
  console.log('PublicHome: Jobs loading:', jobsLoading);
  console.log('PublicHome: Jobs error:', jobsError);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
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
                <Button size="sm" className="absolute right-1 top-1">
                  Go
                </Button>
              </div>
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
                      {category.jobCount || '0'} jobs
                    </span>
                  </div>
                ))}
                <Link href="/categories" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All Categories
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Center - Latest Job Opportunities */}
          <div className="lg:col-span-2">
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
              
              {!jobsLoading && adminJobs && Array.isArray(adminJobs) && adminJobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No admin jobs available at the moment.</p>
                </div>
              )}
              
              {/* Two-column grid layout for jobs */}
              {!jobsLoading && adminJobs && Array.isArray(adminJobs) && adminJobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminJobs.map((job: any) => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Company Logo */}
                          <div className="w-10 h-10 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            {job.company?.logoUrl && job.company.logoUrl !== "NULL" && job.company.logoUrl !== "logos/NULL" ? (
                              <img 
                                src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                                alt={job.company?.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                                <Briefcase className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Job Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                              {job.title}
                            </h3>
                            <p className="text-xs text-blue-600 font-medium mb-2 truncate">
                              {job.company?.name || 'Company Name'}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
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
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                              {job.description?.substring(0, 80)}...
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {/* Vendor Count Badge */}
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {Math.floor(Math.random() * 15) + 1} vendors
                                </Badge>
                                
                                {/* Resume Count Badge */}
                                <Badge variant="secondary" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {Math.floor(Math.random() * 25) + 1} resumes
                                </Badge>
                              </div>
                              
                              <Link href={`/jobs/${job.id}`}>
                                <Button size="sm" variant="outline" className="text-xs">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {!jobsLoading && adminJobs && Array.isArray(adminJobs) && adminJobs.length > 0 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(maxPages, 5) }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage >= maxPages}
                      onClick={() => setCurrentPage(prev => Math.min(maxPages, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Top Companies */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(companies) && companies.slice(0, 10).map((company: any, index: number) => (
                  <div key={company.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 text-sm font-medium text-gray-400">
                      {index + 1}
                    </div>
                    
                    <div className="w-8 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                      {company.logoUrl && company.logoUrl !== "NULL" && company.logoUrl !== "logos/NULL" ? (
                        <img 
                          src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                          alt={company.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.log('Company logo failed to load:', company.logoUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                          <Building2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/companies/${company.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {company.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {company.jobCount || 0} jobs
                      </p>
                    </div>
                  </div>
                ))}
                
                <Link href="/companies" className="text-blue-600 hover:text-blue-800 text-sm font-medium block pt-2">
                  View All Companies
                </Link>
              </CardContent>
            </Card>
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
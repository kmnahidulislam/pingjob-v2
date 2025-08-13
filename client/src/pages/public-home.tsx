import { useQuery } from "@tanstack/react-query";
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
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  // Fetch top companies
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies/top']
  });

  // Fetch latest jobs for the center section
  const { data: latestJobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs?limit=6');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    }
  });

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

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-900 border-b-2 border-blue-500">
              Active Jobs
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Top Companies
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Categories
            </div>
            <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Posted Today
            </div>
          </div>
        </div>
      </div>

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
                {categories.slice(0, 10).map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center">
                    <Link 
                      href={`/jobs?category=${category.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {category.name}
                    </Link>
                    <span className="text-gray-500 text-xs">
                      {category.jobCount || 0} jobs
                    </span>
                  </div>
                ))}
                <Link href="/jobs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
              {latestJobs.slice(0, 6).map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Company Logo */}
                      <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {job.company?.logoUrl && job.company.logoUrl !== "NULL" ? (
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-blue-600 font-medium mb-2">
                          {job.company?.name || 'Company Name'}
                        </p>
                        
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

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {job.category?.name || 'Technology'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {job.applicantCount || 0} applicants
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button size="sm">
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Top Companies */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top Companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {companies.slice(0, 10).map((company: any, index: number) => (
                  <div key={company.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 text-sm font-medium text-gray-400">
                      {index + 1}
                    </div>
                    
                    <div className="w-8 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                      {company.logoUrl && company.logoUrl !== "NULL" ? (
                        <img 
                          src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                          alt={company.name}
                          className="w-full h-full object-contain"
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
    </div>
  );
}
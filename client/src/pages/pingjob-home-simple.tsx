import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Search, Building2, Briefcase, LogOut } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function PingJobHomeSimple() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{jobs: any[], companies: any[]}>({jobs: [], companies: []});
  const [searchLoading, setSearchLoading] = useState(false);

  console.log('PingJobHomeSimple rendering...', { user, searchQuery, showSearchResults });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch admin jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin-jobs', { limit: 20 }],
    queryFn: async () => {
      const response = await fetch('/api/admin-jobs?limit=20');
      if (!response.ok) throw new Error('Failed to fetch admin jobs');
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchLoading(true);
      setShowSearchResults(true);
      
      try {
        const [jobsResponse, companiesResponse] = await Promise.all([
          fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&limit=20`),
          fetch(`/api/companies/search?query=${encodeURIComponent(searchQuery)}&limit=20`)
        ]);
        
        const jobs = jobsResponse.ok ? await jobsResponse.json() : [];
        const companies = companiesResponse.ok ? await companiesResponse.json() : [];
        
        setSearchResults({ jobs, companies });
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults({ jobs: [], companies: [] });
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const jobs = jobsData || [];

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
                  Go
                </Button>
              </form>
            </div>

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
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job with PingJob
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional networking platform with {platformStats?.totalUsers || 899} members, {platformStats?.totalCompanies || 76811} companies, and {platformStats?.activeJobs || 14478} active jobs
          </p>
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
                      {searchResults.jobs.slice(0, 5).map((job: any) => (
                        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{job.company?.name}</p>
                          <div className="flex gap-2 mt-3">
                            <Link href={`/jobs/${job.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            <Link href="/auth" className="flex-1">
                              <Button size="sm" className="w-full">
                                Apply Now
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No jobs found</p>
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
                      {searchResults.companies.slice(0, 5).map((company: any) => (
                        <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-1">{company.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{company.city}, {company.state}</p>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" className="w-full">
                              View Company
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No companies found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Latest Jobs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Job Opportunities</h2>
          <p className="text-gray-600">Discover new opportunities from top companies</p>
        </div>

        {jobsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.slice(0, 6).map((job: any) => (
              <div key={job.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-3">{job.company?.name}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>
                <div className="flex gap-2">
                  <Link href={`/jobs/${job.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href="/auth" className="flex-1">
                    <Button size="sm" className="w-full">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/jobs">
            <Button size="lg">View All Jobs</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
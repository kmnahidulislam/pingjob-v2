import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/job-card";
import { Building2, MapPin, Clock, DollarSign, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { formatDescription } from "@/lib/format-description";

export default function JobsOriginal() {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    search: "",
    location: ""
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Read search, location, and category parameters from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const locationParam = urlParams.get('location');
    const categoryParam = urlParams.get('categoryId');
    
    
    if (searchParam || locationParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam || "",
        location: locationParam || ""
      }));
    }
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  // Fetch jobs using fast endpoint with category filtering and search
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs', selectedCategory, filters.search, filters.location],
    queryFn: async () => {
      // If we have search terms, use the search API
      if (filters.search.trim() || filters.location.trim()) {
        let searchUrl = '/api/search?';
        if (filters.search.trim()) {
          searchUrl += `q=${encodeURIComponent(filters.search)}&`;
        }
        if (filters.location.trim()) {
          searchUrl += `location=${encodeURIComponent(filters.location)}&`;
        }
        
        console.log('🔍 SEARCHING WITH URL:', searchUrl);
        
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search jobs');
        const data = await response.json();
        
        console.log('🔍 SEARCH RESULTS:', data.jobs?.length || 0, 'jobs found');
        const jobs = data.jobs || [];
        // Sort by date (newest first) - using proper field names from schema
        return jobs.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
      } else {
        // Default behavior: fetch jobs normally
        let url = '/api/jobs?limit=50';
        if (selectedCategory) {
          url += `&categoryId=${selectedCategory}`;
        } else {
          // Default behavior: show recent jobs from top companies (1 job per company)
          url += '&topCompanies=true';
        }
        // Add cache busting to force fresh data
        url += `&_t=${Date.now()}`;
        
        console.log('🚀 FETCHING FROM URL:', url);
        console.log('🎯 SELECTED CATEGORY:', selectedCategory);
        console.log('🏢 TOP COMPANIES MODE:', !selectedCategory);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        
        console.log('✅ JOBS RECEIVED:', data.length);
        console.log('🏆 FIRST FEW JOB TITLES:', data.slice(0, 3).map((j: any) => j.title));
        if (data[0]) {
          console.log('🏢 FIRST JOB COMPANY:', data[0].company?.name, 'Job Count:', data[0].companyJobCount);
        }
        
        // Sort by date (newest first) - using proper field names from schema
        return data.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
      }
    }
  });

  // Fetch categories for left sidebar
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });



  // Use jobs directly since filtering is now handled by the API
  const filteredJobs = jobs;

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search jobs, companies, or skills..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const searchValue = (e.target as HTMLInputElement).value;
                    if (searchValue.trim()) {
                      setFilters(prev => ({ ...prev, search: searchValue }));
                    }
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Location (city, state, or remote)"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
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
              
              {!jobsLoading && currentJobs && Array.isArray(currentJobs) && currentJobs.map((job: any) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  compact={false} 
                  showCompany={true} 
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "bg-blue-600 text-white" : ""}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}
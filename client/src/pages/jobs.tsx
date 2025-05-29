import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import JobCard from "@/components/job-card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema } from "@shared/schema";
import { z } from "zod";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Users,
  Building,
  TrendingUp,
  BookOpen,
  Plus,
  Check,
  ChevronsUpDown
} from "lucide-react";
import type { SearchFilters } from "@/lib/types";

const jobFormSchema = insertJobSchema.extend({
  companyId: z.number().min(1, "Company is required"),
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required"),
  location: z.string().min(1, "Location is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Get search query from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
      setFilters(prev => ({ ...prev, search }));
    }
  }, []);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['/api/jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    }
  });

  const { data: savedJobs } = useQuery({
    queryKey: ['/api/saved-jobs'],
    enabled: !!user
  });

  const { data: applications } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user && user.userType === 'job_seeker'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchQuery }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value 
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const appliedJobIds = applications?.map((app: any) => app.job?.id) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Job Type</label>
                <Select onValueChange={(value) => handleFilterChange('jobType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">Experience Level</label>
                <Select onValueChange={(value) => handleFilterChange('experienceLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="entry">Entry level</SelectItem>
                    <SelectItem value="mid">Mid level</SelectItem>
                    <SelectItem value="senior">Senior level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Enter location"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              {/* Industry */}
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <Select onValueChange={(value) => handleFilterChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Seeker Stats */}
          {user?.userType === 'job_seeker' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Job Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications sent</span>
                  <span className="font-semibold">{applications?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Saved jobs</span>
                  <span className="font-semibold">{savedJobs?.length || 0}</span>
                </div>
                <Button variant="outline" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Job Search Tips
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Header */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search jobs, companies, keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="bg-linkedin-blue hover:bg-linkedin-dark">
                  Search Jobs
                </Button>
              </form>
              
              {/* Active Filters */}
              {Object.values(filters).some(Boolean) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary">
                      Search: {filters.search}
                    </Badge>
                  )}
                  {filters.jobType && (
                    <Badge variant="secondary">
                      Type: {filters.jobType.replace('_', ' ')}
                    </Badge>
                  )}
                  {filters.experienceLevel && (
                    <Badge variant="secondary">
                      Level: {filters.experienceLevel}
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary">
                      Location: {filters.location}
                    </Badge>
                  )}
                  {filters.industry && (
                    <Badge variant="secondary">
                      Industry: {filters.industry}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {filters.search ? `Jobs matching "${filters.search}"` : 'All Jobs'}
              </h1>
              <p className="text-gray-600">
                {isLoading ? 'Loading...' : `${jobs?.length || 0} jobs found`}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select defaultValue="newest">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              jobs.map((job: any) => (
                <div key={job.id} className="relative">
                  <JobCard job={job} />
                  {appliedJobIds.includes(job.id) && (
                    <Badge 
                      className="absolute top-4 right-4 bg-success-green text-white"
                    >
                      Applied
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or removing some filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Load More */}
          {jobs && jobs.length > 0 && (
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                Load More Jobs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

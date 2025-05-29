import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
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
  skills: z.string().optional(), // Keep as string in form, convert to array on submit
});

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/jobs/:id");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // If we have a job ID, show job details instead of job list
  const jobId = params?.id;

  // Get search query from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
      setFilters(prev => ({ ...prev, search }));
    }
  }, []);

  // Fetch individual job if jobId is provided
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['/api/jobs', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch job');
      return response.json();
    },
    enabled: !!jobId
  });

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
    },
    enabled: !jobId
  });

  const { data: savedJobs } = useQuery({
    queryKey: ['/api/saved-jobs'],
    enabled: !!user
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: applications } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user && user.userType === 'job_seeker'
  });

  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
    enabled: user?.userType === 'admin',
    queryFn: async () => {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  const jobForm = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      salary: "",
      jobType: "full_time",
      experienceLevel: "mid",
      skills: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData: z.infer<typeof jobFormSchema>) => {
      // Convert comma-separated skills string to array
      const processedJobData = {
        ...jobData,
        skills: jobData.skills ? jobData.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0) : []
      };
      return apiRequest('POST', '/api/jobs', processedJobData);
    },
    onSuccess: () => {
      toast({
        title: "Job created successfully",
        description: "The job posting has been added to the platform"
      });
      setIsAddJobOpen(false);
      jobForm.reset();
      setSelectedCompany(null);
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: any) => {
      console.error("Job creation error:", error);
      toast({
        title: "Error creating job",
        description: error.message || error.error || "Failed to create job posting",
        variant: "destructive"
      });
    }
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

  // If we're viewing a specific job, show job details
  if (jobId) {
    if (jobLoading) {
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!job) {
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job not found</h3>
                <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-6"
          >
            ← Back to Jobs
          </Button>
          
          <JobCard job={job} compact={false} showCompany={true} />
        </div>
      </div>
    );
  }

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
                {user?.userType === 'admin' && (
                  <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Job</DialogTitle>
                      </DialogHeader>
                      <Form {...jobForm}>
                        <form onSubmit={jobForm.handleSubmit((data) => {
                          console.log("Form data:", data);
                          console.log("Selected company:", selectedCompany);
                          console.log("Form errors:", jobForm.formState.errors);
                          
                          if (!selectedCompany) {
                            toast({
                              title: "Company required",
                              description: "Please select a company for this job",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          const jobData = {
                            ...data,
                            companyId: selectedCompany.id
                          };
                          
                          console.log("Submitting job data:", jobData);
                          createJobMutation.mutate(jobData);
                        }, (errors) => {
                          console.log("Form validation errors:", errors);
                          toast({
                            title: "Form validation error",
                            description: "Please check all required fields",
                            variant: "destructive"
                          });
                        })} className="space-y-4">
                          {/* Company Selection with Autocomplete */}
                          <FormField
                            control={jobForm.control}
                            name="companyId"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Company</FormLabel>
                                <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={`w-full justify-between ${!selectedCompany && "text-muted-foreground"}`}
                                      >
                                        {selectedCompany ? selectedCompany.name : "Select company..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search companies..." />
                                      <CommandEmpty>No company found.</CommandEmpty>
                                      <CommandGroup>
                                        {companies?.map((company: any) => (
                                          <CommandItem
                                            key={company.id}
                                            value={company.name}
                                            onSelect={() => {
                                              setSelectedCompany(company);
                                              field.onChange(company.id);
                                              setCompanySearchOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                selectedCompany?.id === company.id ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            <div className="flex items-center space-x-2">
                                              <Building className="h-4 w-4" />
                                              <span>{company.name}</span>
                                              {company.city && (
                                                <span className="text-sm text-gray-500">• {company.city}</span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={jobForm.control}
                              name="jobType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select job type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="full_time">Full-time</SelectItem>
                                      <SelectItem value="part_time">Part-time</SelectItem>
                                      <SelectItem value="contract">Contract</SelectItem>
                                      <SelectItem value="remote">Remote</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={jobForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe the role, responsibilities, and requirements..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={jobForm.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories?.map((category: any) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. San Francisco" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={jobForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. California" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Zip Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. 94105" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={jobForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. United States" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={jobForm.control}
                              name="salary"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Salary</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. $120,000 - $150,000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="experienceLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Experience Level</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select experience level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="entry">Entry Level</SelectItem>
                                      <SelectItem value="mid">Mid Level</SelectItem>
                                      <SelectItem value="senior">Senior Level</SelectItem>
                                      <SelectItem value="executive">Executive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={jobForm.control}
                              name="skills"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Required Skills</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. React, Node.js, Python" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={jobForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. San Francisco, CA, United States" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddJobOpen(false);
                                jobForm.reset();
                                setSelectedCompany(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createJobMutation.isPending}
                              className="bg-linkedin-blue hover:bg-linkedin-dark"
                              onClick={() => console.log("Submit button clicked")}
                            >
                              {createJobMutation.isPending ? "Creating..." : "Create Job"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
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

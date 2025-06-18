import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { Briefcase, MapPin, DollarSign, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type JobFormData = {
  title: string;
  description: string;
  requirements: string;
  country: string;
  state: string;
  city: string;
  zipCode?: string;
  location?: string;
  salary?: string;
  employmentType: "full_time" | "part_time" | "contract" | "remote";
  experienceLevel: "entry" | "mid" | "senior" | "executive";
  skills?: string;
  companyId: number;
  categoryId: number;
};

const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(20, "Requirements must be at least 20 characters"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "remote"]),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
  skills: z.string().optional(),
  companyId: z.number().min(1, "Company selection is required"),
  categoryId: z.number().min(1, "Category selection is required"),
}) satisfies z.ZodType<JobFormData>;

export default function JobCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(companySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  // Load companies with intelligent loading strategy
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies', { search: debouncedSearch }],
    queryFn: async () => {
      if (debouncedSearch && debouncedSearch.length >= 2) {
        // Search mode - load matching companies
        console.log('Searching for companies with query:', debouncedSearch);
        const response = await fetch(`/api/companies?q=${encodeURIComponent(debouncedSearch)}&limit=1000`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        const results = await response.json();
        console.log('Search results:', results);
        return results;
      } else {
        // Initial load - show popular/recent companies
        const response = await fetch('/api/companies?limit=500');
        if (!response.ok) throw new Error('Failed to fetch companies');
        return response.json();
      }
    },
    enabled: true,
    staleTime: 300000, // Cache for 5 minutes
  });

  const companies = companiesData || [];
  
  // Debug logging
  console.log('Debug - companySearch:', companySearch);
  console.log('Debug - debouncedSearch:', debouncedSearch);
  console.log('Debug - companies:', companies);
  console.log('Debug - companiesLoading:', companiesLoading);



  // Location data queries
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error('Failed to fetch countries');
      return response.json();
    }
  });

  const { data: states } = useQuery({
    queryKey: ['/api/states', selectedCountryId],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/states/${selectedCountryId}`);
      if (!response.ok) throw new Error('Failed to fetch states');
      return response.json();
    },
    enabled: !!selectedCountryId
  });

  const { data: cities } = useQuery({
    queryKey: ['/api/cities', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const response = await fetch(`/api/cities/${selectedStateId}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: !!selectedStateId
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const jobForm = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      country: "",
      state: "",
      city: "",
      zipCode: "",
      location: "",
      salary: "",
      employmentType: "full_time",
      experienceLevel: "mid",
      skills: "",
      companyId: 0,
      categoryId: 0,
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: JobFormData) => {
      const processedData = {
        ...jobData,
        location: `${jobData.city}, ${jobData.state}, ${jobData.country}`,
        skills: jobData.skills ? [jobData.skills] : [],
      };
      return apiRequest('POST', '/api/jobs', processedData);
    },
    onSuccess: () => {
      toast({
        title: "Job posted successfully",
        description: "Your job posting is now live and visible to candidates"
      });
      jobForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: any) => {
      console.error("Job creation error:", error);
      toast({
        title: "Error creating job",
        description: error.message || "Failed to create job posting",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: JobFormData) => {
    console.log("Job form submitted with data:", data);
    console.log("Selected company:", selectedCompany);
    console.log("Form errors:", jobForm.formState.errors);
    
    // Ensure companyId is set
    if (!data.companyId && selectedCompany) {
      data.companyId = selectedCompany.id;
    }
    
    console.log("Final data being sent:", data);
    createJobMutation.mutate(data);
  };

  // Check URL parameters for pre-selected company
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('companyId');
    const companyName = urlParams.get('companyName');
    
    if (companyId && companyName) {
      const preSelectedCompany = {
        id: parseInt(companyId),
        name: decodeURIComponent(companyName)
      };
      setSelectedCompany(preSelectedCompany);
      setCompanySearch(preSelectedCompany.name);
      jobForm.setValue('companyId', parseInt(companyId));
      console.log("Pre-selected company from URL:", preSelectedCompany);
    }
  }, [jobForm]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to post a job.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow access to all companies for job creation
  const availableCompanies = companies || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Post a New Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...jobForm}>
              <form onSubmit={jobForm.handleSubmit(handleSubmit)} className="space-y-6">
                
                {/* Company Selection - Simple Input */}
                <FormField
                  control={jobForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <div className="space-y-2">
                        <Input
                          placeholder="Type company name to search all 50,000+ companies..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                        />
                        {!companySearch && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 Tip: Start typing to search from our complete database of 50,000+ companies. First 500 popular companies shown below.
                          </div>
                        )}
                        {(companySearch.length >= 2 || (!companySearch && companies?.length > 0)) && (
                          <div className="max-h-48 overflow-auto border rounded-md bg-white">
                            {companiesLoading ? (
                              <div className="p-3 text-sm text-gray-500">
                                {companySearch ? 'Searching...' : 'Loading companies...'}
                              </div>
                            ) : companies?.length > 0 ? (
                              <>
                                {!companySearch && (
                                  <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                                    Popular companies (showing 500 of 50,000+)
                                  </div>
                                )}
                                {companies.map((company: any) => (
                                  <div
                                    key={company.id}
                                    className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      field.onChange(company.id);
                                      setCompanySearch(company.name);
                                      // Clear search state immediately to hide dropdown
                                      setTimeout(() => {
                                        setDebouncedSearch("");
                                      }, 100);
                                    }}
                                  >
                                    <div className="font-medium">{company.name}</div>
                                    <div className="text-sm text-gray-500">{company.industry}</div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="p-3 text-sm text-gray-500">No companies found</div>
                            )}
                          </div>
                        )}
                        {selectedCompany && (
                          <div className="text-sm text-green-600">
                            Selected: {selectedCompany.name}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Title */}
                <FormField
                  control={jobForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Category */}
                <FormField
                  control={jobForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        disabled={categoriesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job category" />
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

                {/* Location Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={jobForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const countryObj = countries?.find((c: any) => c.name === value);
                            if (countryObj) {
                              setSelectedCountryId(countryObj.id);
                              setSelectedStateId(null);
                              jobForm.setValue('state', '');
                              jobForm.setValue('city', '');
                            }
                            field.onChange(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries?.map((country: any) => (
                              <SelectItem key={country.id} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const stateObj = states?.find((s: any) => s.name === value);
                            if (stateObj) {
                              setSelectedStateId(stateObj.id);
                              jobForm.setValue('city', '');
                            }
                            field.onChange(value);
                          }} 
                          defaultValue={field.value}
                          disabled={!selectedCountryId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedCountryId ? "Select state" : "Select country first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states?.map((state: any) => (
                              <SelectItem key={state.id} value={state.name}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={jobForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!selectedStateId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedStateId ? "Select city" : "Select state first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities?.map((city: any) => (
                              <SelectItem key={city.id} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Job Type and Level */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={jobForm.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment type" />
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

                  <FormField
                    control={jobForm.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
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
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={jobForm.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Salary Range</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                            <Input 
                              placeholder="e.g. $50,000 - $80,000 per year" 
                              className="pl-10" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Job Description */}
                <FormField
                  control={jobForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Requirements */}
                <FormField
                  control={jobForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List the required skills, experience, education, and qualifications..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createJobMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createJobMutation.isPending ? "Posting..." : "Post Job"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
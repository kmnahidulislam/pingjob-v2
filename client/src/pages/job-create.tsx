import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { Briefcase, MapPin, DollarSign, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const jobFormSchema = insertJobSchema.omit({ employmentType: true }).extend({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(20, "Requirements must be at least 20 characters"),
  location: z.string().min(1, "Location is required"),
  salaryMin: z.number().min(0, "Minimum salary must be positive").optional(),
  salaryMax: z.number().min(0, "Maximum salary must be positive").optional(),
  companyId: z.number().min(1, "Company selection is required"),
  categoryId: z.number().min(1, "Category selection is required"),
});

export default function JobCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(companySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  // Load companies only when searching
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies', { search: debouncedSearch }],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return []; // Return empty array if no search term
      }
      const response = await fetch(`/api/companies?q=${encodeURIComponent(debouncedSearch)}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
    enabled: debouncedSearch && debouncedSearch.length >= 2,
    staleTime: 300000, // Cache for 5 minutes
  });

  const companies = companiesData || [];



  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const jobForm = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      jobType: "full_time",
      experienceLevel: "mid",
      salaryMin: undefined,
      salaryMax: undefined,
      companyId: undefined,
      categoryId: undefined,
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: z.infer<typeof jobFormSchema>) => {
      return apiRequest('POST', '/api/jobs', jobData);
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

  const handleSubmit = (data: z.infer<typeof jobFormSchema>) => {
    console.log("Job form submitted with data:", data);
    createJobMutation.mutate(data);
  };

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
                          placeholder="Type company name to search..."
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                        />
                        {companySearch.length >= 2 && (
                          <div className="max-h-48 overflow-auto border rounded-md bg-white">
                            {companiesLoading ? (
                              <div className="p-3 text-sm text-gray-500">Searching...</div>
                            ) : companies?.length > 0 ? (
                              companies.map((company: any) => (
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
                              ))
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

                {/* Location */}
                <FormField
                  control={jobForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                          <Input placeholder="e.g. San Francisco, CA" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Type and Level */}
                <div className="grid grid-cols-2 gap-4">
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
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                            <Input 
                              type="number" 
                              placeholder="50000" 
                              className="pl-10" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="salaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                            <Input 
                              type="number" 
                              placeholder="100000" 
                              className="pl-10" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
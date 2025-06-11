import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "@/components/job-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, insertJobSchema } from "@shared/schema";
import { z } from "zod";
import {
  Building,
  Search,
  Users,
  MapPin,
  Globe,
  Briefcase,
  TrendingUp,
  Heart,
  Eye,
  Share,
  Plus,
  Filter,
  Phone,
  Star,
  Check,
  X,
  Edit
} from "lucide-react";
import { Link } from "wouter";

// Search Results Components
function SearchResultsCompanies({ companies, searchQuery, onSelectCompany, onFollowCompany }: {
  companies: any[];
  searchQuery: string;
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No companies found</h3>
        <p className="text-gray-600">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={company.logoUrl && company.logoUrl !== "NULL" ? company.logoUrl : undefined} 
                  alt={company.name} 
                />
                <AvatarFallback className="text-lg font-semibold">
                  {company.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-linkedin-blue hover:text-linkedin-dark cursor-pointer">
                      {company.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{company.industry}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.city}, {company.state || company.country}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.size} employees
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCompany(company)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFollowCompany(company.id)}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Follow
                    </Button>
                  </div>
                </div>
                
                {company.description && (
                  <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                    {company.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {company.followers} followers
                  </Badge>
                  {company.zipCode && company.zipCode !== "NULL" && (
                    <span className="text-xs text-gray-500">
                      {company.zipCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SearchResultsJobs({ searchQuery }: { searchQuery: string }) {
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { companies: [], jobs: [], total: 0 };
      const response = await fetch(`/api/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
  });

  const jobs = searchResults?.jobs || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-linkedin-blue"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
        <p className="text-gray-600">Try searching for different skills or job titles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
        </h3>
        <Button asChild variant="outline">
          <Link href="/jobs">View all jobs</Link>
        </Button>
      </div>
      
      <div className="grid gap-4">
        {jobs.map((job: any) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function SearchResultsDisplay({ searchQuery, companies, onSelectCompany, onFollowCompany }: {
  searchQuery: string;
  companies: any[];
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
}) {
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { companies: [], jobs: [], total: 0 };
      const response = await fetch(`/api/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
  });

  const jobs = searchResults?.jobs || [];
  const searchCompanies = searchResults?.companies || [];
  const totalResults = searchCompanies.length + jobs.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Found {totalResults} results ({companies.length} companies, {jobs.length} jobs)
              </p>
            </div>
            {isLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-linkedin-blue"></div>
            )}
          </div>
          
          {/* Search Results Tabs */}
          <Tabs defaultValue="companies" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Companies ({searchCompanies.length > 0 ? searchCompanies.length : companies.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Jobs ({jobs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="companies" className="mt-6">
              <SearchResultsCompanies 
                companies={searchCompanies.length > 0 ? searchCompanies : companies} 
                searchQuery={searchQuery}
                onSelectCompany={onSelectCompany}
                onFollowCompany={onFollowCompany}
              />
            </TabsContent>
            
            <TabsContent value="jobs" className="mt-6">
              <SearchResultsJobs searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
          
          {/* No Results State */}
          {totalResults === 0 && !isLoading && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any companies or jobs matching "{searchQuery}"
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Try searching for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Different keywords or job titles</li>
                  <li>Company names or locations</li>
                  <li>Skills or technologies</li>
                  <li>ZIP codes or cities</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import type { Company } from "@/lib/types";

const companyFormSchema = insertCompanySchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(1, "Description is required"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
});

// Component to display company details (open positions and vendors)
function CompanyDetails({ companyId }: { companyId: number }) {
  const { data: companyJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs', 'company', companyId],
    queryFn: async () => {
      const response = await fetch(`/api/jobs?companyId=${companyId}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const { data: companyDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/details`);
      if (!response.ok) throw new Error('Failed to fetch company details');
      return response.json();
    },
  });

  if (jobsLoading || detailsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const jobs = companyJobs || [];
  const vendors = companyDetails?.vendors || [];

  return (
    <div className="space-y-6">
      {/* Open Positions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-linkedin-blue" />
            Open Positions ({jobs.length})
          </h3>
        </div>
        
        {jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        {job.employmentType && (
                          <Badge variant="secondary" className="text-xs">
                            {job.employmentType.replace('_', ' ')}
                          </Badge>
                        )}
                        {job.experienceLevel && (
                          <Badge variant="outline" className="text-xs">
                            {job.experienceLevel} level
                          </Badge>
                        )}
                      </div>
                      {job.salary && (
                        <div className="text-sm text-gray-600 mb-2">
                          💰 {job.salary}
                        </div>
                      )}
                      {job.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="ml-4"
                      onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                    >
                      View Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No Open Positions</h3>
              <p className="text-gray-600 text-sm">This company doesn't have any job openings at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CompanyVendors({ companyId }: { companyId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  
  const { data: companyDetails, isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/details`);
      if (!response.ok) throw new Error('Failed to fetch company details');
      return response.json();
    },
  });

  const vendorForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      services: "",
      companyId: companyId
    }
  });

  const addVendorMutation = useMutation({
    mutationFn: (vendorData: any) => apiRequest('POST', '/api/vendors', vendorData),
    onSuccess: () => {
      toast({
        title: "Vendor added successfully",
        description: "The vendor has been added and is pending approval"
      });
      setIsAddVendorOpen(false);
      vendorForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'details'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding vendor",
        description: error.message || "Failed to add vendor",
        variant: "destructive"
      });
    }
  });

  const renderAddVendorDialog = () => (
    <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor to this company. The vendor will be pending approval until reviewed.
          </DialogDescription>
        </DialogHeader>
        <Form {...vendorForm}>
          <form onSubmit={vendorForm.handleSubmit((data) => addVendorMutation.mutate(data))} className="space-y-4">
            <FormField
              control={vendorForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={vendorForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vendor@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={vendorForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={vendorForm.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services Provided</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the services offered" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddVendorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addVendorMutation.isPending} className="bg-linkedin-blue hover:bg-linkedin-dark">
                {addVendorMutation.isPending ? "Adding..." : "Add Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
        <p>Loading vendors...</p>
      </div>
    );
  }

  const vendors = companyDetails?.vendors || [];

  if (vendors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Vendors</h3>
          <Button onClick={() => setIsAddVendorOpen(true)} className="bg-linkedin-blue hover:bg-linkedin-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No vendors registered for this company</p>
          <p className="text-sm mt-2">Vendors provide services and support to this organization</p>
        </div>
        {renderAddVendorDialog()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vendors ({vendors.length})</h3>
        <Button onClick={() => setIsAddVendorOpen(true)} className="bg-linkedin-blue hover:bg-linkedin-dark">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>
      <div className="grid gap-4">
        {vendors.map((vendor: any) => (
          <Card key={vendor.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <Building className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg text-gray-900">{vendor.name}</h4>
                  <p className="text-gray-600 font-medium">{vendor.services}</p>
                  
                  {vendor.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {vendor.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    {vendor.contactEmail && (
                      <div className="flex items-center">
                        <span>📧 {vendor.contactEmail}</span>
                      </div>
                    )}
                    {vendor.contactPhone && (
                      <div className="flex items-center">
                        <span>📞 {vendor.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge 
                  variant={vendor.status === 'approved' ? 'default' : 
                          vendor.status === 'pending' ? 'secondary' : 'destructive'}
                  className={vendor.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                >
                  {vendor.status}
                </Badge>
                
                {vendor.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-1" />
                      Visit
                    </a>
                  </Button>
                )}
              </div>
            </div>
            
            {vendor.specializations && vendor.specializations.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-2">
                  {vendor.specializations.map((spec: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      {renderAddVendorDialog()}
    </div>
  );
}

// Job form schema for admin job creation
const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Job description is required"),
  requirements: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "remote"]),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
  location: z.string().min(1, "Location is required"),
  salary: z.string().optional(),
  benefits: z.string().optional(),
  skills: z.string().optional(),
});

export default function Companies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormCompany, setJobFormCompany] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Get search query from URL params for global search
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get('search') || '';

  // Load companies based on search query from global search
  const { data: companies, isLoading } = useQuery({
    queryKey: ['/api/companies', { q: searchQuery }],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        const response = await fetch('/api/companies?limit=50');
        if (!response.ok) throw new Error('Failed to fetch companies');
        return response.json();
      }
      const response = await fetch(`/api/companies?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  // Fetch pending companies for admin approval
  const { data: pendingCompanies } = useQuery({
    queryKey: ['/api/companies/pending'],
    enabled: user?.userType === 'admin',
    queryFn: async () => {
      const response = await fetch('/api/companies/pending');
      if (!response.ok) throw new Error('Failed to fetch pending companies');
      return response.json();
    }
  });

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      website: "",
      phone: "",
      city: "",
      state: "",
      country: "",
    },
  });

  // Job form for admin job creation
  const jobForm = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      employmentType: "full_time",
      experienceLevel: "mid",
      location: "",
      salary: "",
      benefits: "",
      skills: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: z.infer<typeof companyFormSchema>) => {
      let logoUrl = "";
      
      // Upload logo first if one is selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const logoResponse = await fetch('/api/upload/company-logo', {
          method: 'POST',
          body: formData,
        });
        
        if (logoResponse.ok) {
          const logoResult = await logoResponse.json();
          logoUrl = logoResult.logoUrl;
        }
      }
      
      // Create company with logo URL
      return apiRequest('POST', '/api/companies', {
        ...companyData,
        logoUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Company submitted for approval",
        description: "Your company will be reviewed by our team and approved shortly"
      });
      setShowCreateForm(false);
      companyForm.reset();
      setLogoFile(null);
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error: any) => {
      console.error("Company creation error:", error);
      toast({
        title: "Error creating company",
        description: error.message || "Failed to create company",
        variant: "destructive"
      });
    }
  });

  // Job creation mutation for admins
  const createJobMutation = useMutation({
    mutationFn: async (jobData: z.infer<typeof jobFormSchema> & { companyId: number }) => {
      const processedData = {
        ...jobData,
        recruiterId: user?.id,
        skills: jobData.skills ? jobData.skills.split(',').map(s => s.trim()) : [],
      };
      
      return apiRequest('POST', '/api/jobs', processedData);
    },
    onSuccess: () => {
      toast({
        title: "Job created successfully",
        description: "The job has been posted and is now available for applications"
      });
      setShowJobForm(false);
      setJobFormCompany(null);
      jobForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${jobFormCompany?.id}/jobs`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating job",
        description: error.message || "Failed to create job",
        variant: "destructive"
      });
    }
  });

  const approveCompanyMutation = useMutation({
    mutationFn: (companyId: number) =>
      apiRequest('PUT', `/api/companies/${companyId}/approve`, {}),
    onSuccess: () => {
      toast({
        title: "Company approved",
        description: "The company has been approved and is now visible to all users"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error approving company",
        description: error.message || "Failed to approve company",
        variant: "destructive"
      });
    }
  });

  const rejectCompanyMutation = useMutation({
    mutationFn: (companyId: number) =>
      apiRequest('PUT', `/api/companies/${companyId}/reject`, {}),
    onSuccess: () => {
      toast({
        title: "Company rejected",
        description: "The company has been rejected"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error rejecting company",
        description: error.message || "Failed to reject company",
        variant: "destructive"
      });
    }
  });

  const { data: companyJobs } = useQuery({
    queryKey: [`/api/companies/${selectedCompany?.id}/jobs`],
    enabled: !!selectedCompany,
    queryFn: async () => {
      const response = await fetch(`/api/jobs?companyId=${selectedCompany?.id}`);
      if (!response.ok) throw new Error('Failed to fetch company jobs');
      return response.json();
    }
  });

  const { data: userCompany } = useQuery({
    queryKey: ['/api/user/company'],
    enabled: !!user && user.userType === 'client'
  });

  const followMutation = useMutation({
    mutationFn: (companyId: number) =>
      apiRequest('POST', `/api/companies/${companyId}/follow`),
    onSuccess: () => {
      toast({
        title: "Following company",
        description: "You'll now receive updates from this company"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow company",
        variant: "destructive"
      });
    }
  });



  const handleFollowCompany = (companyId: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to follow companies",
        variant: "destructive"
      });
      return;
    }
    followMutation.mutate(companyId);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredCompanies = companies || [];

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Selected Company Details - Full Width at Top */}
      {selectedCompany && (
        <Card className="mb-8 border-2 border-linkedin-blue shadow-xl relative bg-white">
          <CardContent className="p-0">
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("Closing selected company");
                  setSelectedCompany(null);
                }}
                className="bg-white/90 hover:bg-white shadow-md rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Company Header */}
            <div className="h-32 bg-gradient-to-r from-linkedin-blue to-linkedin-light relative"></div>
            <div className="p-6 -mt-16">
              <div className="flex items-start space-x-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={selectedCompany.logoUrl || undefined} />
                  <AvatarFallback className="bg-linkedin-blue text-white text-2xl">
                    <Building className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-gray-600 font-medium">
                    {selectedCompany.industry}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{formatFollowerCount(selectedCompany.followers || 0)} followers</span>
                    </div>
                    {selectedCompany.size && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{selectedCompany.size} employees</span>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        <a 
                          href={selectedCompany.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-linkedin-blue hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Company Address */}
                  {(selectedCompany.city || selectedCompany.state || selectedCompany.country) && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mt-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {[selectedCompany.city, selectedCompany.state, selectedCompany.zipCode, selectedCompany.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {/* Admin Add Job Button */}
                  {user?.userType === 'admin' && (
                    <Button
                      onClick={() => {
                        setJobFormCompany(selectedCompany);
                        setShowJobForm(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Add Job
                    </Button>
                  )}
                  <Button
                    onClick={() => handleFollowCompany(selectedCompany.id)}
                    disabled={followMutation.isPending}
                    className="bg-linkedin-blue hover:bg-linkedin-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Company Description */}
              {selectedCompany.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedCompany.description}
                  </p>
                </div>
              )}

              {/* Company Jobs and Vendors */}
              <div className="mt-6">
                <Tabs defaultValue="jobs" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="jobs">Open Positions</TabsTrigger>
                    <TabsTrigger value="vendors">Vendors</TabsTrigger>
                  </TabsList>
                  <TabsContent value="jobs" className="mt-4">
                    <CompanyDetails companyId={selectedCompany.id} />
                  </TabsContent>
                  <TabsContent value="vendors" className="mt-4">
                    <CompanyVendors companyId={selectedCompany.id} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User's Company (for clients) */}
              {user?.userType === 'client' && userCompany && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Your Company</h4>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userCompany.logoUrl || undefined} />
                        <AvatarFallback className="bg-linkedin-blue text-white">
                          <Building className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h5 className="font-medium text-sm">{userCompany.name}</h5>
                        <p className="text-xs text-gray-600">{userCompany.industry}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3" size="sm">
                      <Link href={`/companies/${userCompany.id}`}>
                        Manage Company
                      </Link>
                    </Button>
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-linkedin-blue">
                    {companies?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
              </div>

              <Separator />

              {/* Industry Filter */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Popular Industries</h4>
                <div className="space-y-2">
                  {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'].map((industry) => (
                    <Button
                      key={industry}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => window.location.href = `/companies?search=${encodeURIComponent(industry)}`}
                    >
                      {industry}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Create Company (for clients and admins) */}
              {(user?.userType === 'client' || user?.userType === 'admin') && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-linkedin-blue hover:bg-linkedin-dark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company Page
                </Button>
              )}
              
              {/* Admin Controls */}
              {user?.userType === 'admin' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowPendingApprovals(!showPendingApprovals)}
                    variant="outline"
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Pending Approvals ({pendingCompanies?.length || 0})
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/job-create">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post New Job
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Enhanced Search Results Header */}
          {searchQuery && (
            <SearchResultsDisplay 
              searchQuery={searchQuery}
              companies={filteredCompanies}
              onSelectCompany={setSelectedCompany}
              onFollowCompany={handleFollowCompany}
            />
          )}

          {/* Company Details Modal/Sidebar */}
          {selectedCompany && (
            <Card className="mb-6 border-2 border-linkedin-blue shadow-lg">
              <CardContent className="p-0">
                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCompany(null)}
                    className="bg-white/80 hover:bg-white shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Company Header */}
                <div className="h-32 bg-gradient-to-r from-linkedin-blue to-linkedin-light relative"></div>
                <div className="p-6 -mt-16">
                  <div className="flex items-start space-x-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={selectedCompany.logoUrl || undefined} />
                      <AvatarFallback className="bg-linkedin-blue text-white text-2xl">
                        <Building className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCompany.name}
                      </h2>
                      <p className="text-gray-600 font-medium">
                        {selectedCompany.industry}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{formatFollowerCount(selectedCompany.followers || 0)} followers</span>
                        </div>
                        {selectedCompany.size && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{selectedCompany.size} employees</span>
                          </div>
                        )}
                        {selectedCompany.website && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            <a 
                              href={selectedCompany.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-linkedin-blue hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                        {selectedCompany.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            <a 
                              href={`tel:${selectedCompany.phone}`}
                              className="text-linkedin-blue hover:underline"
                            >
                              {selectedCompany.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Company Address */}
                      {(selectedCompany.city || selectedCompany.state || selectedCompany.country) && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mt-3">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {[selectedCompany.city, selectedCompany.state, selectedCompany.zipCode, selectedCompany.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {/* Admin Add Job Button */}
                      {user?.userType === 'admin' && (
                        <Button
                          onClick={() => {
                            console.log('Add Job clicked for company:', selectedCompany);
                            setJobFormCompany(selectedCompany);
                            setShowJobForm(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          Add Job
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          console.log('Follow clicked for company:', selectedCompany.id);
                          handleFollowCompany(selectedCompany.id);
                        }}
                        disabled={followMutation.isPending}
                        className="bg-linkedin-blue hover:bg-linkedin-dark"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {followMutation.isPending ? "Following..." : "Follow"}
                      </Button>
                      <Button variant="outline">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Company Description */}
                  {selectedCompany.description && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-2">About</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCompany.description}
                      </p>
                    </div>
                  )}

                  {/* Company Details Tabs */}
                  <div className="mt-6">
                    <Tabs defaultValue="jobs" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="jobs" className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Jobs ({companyJobs?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="vendors" className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Vendors
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="jobs" className="mt-4">
                        {companyJobs && companyJobs.length > 0 ? (
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {companyJobs.slice(0, 4).map((job: any) => (
                                <JobCard key={job.id} job={job} compact showCompany={false} />
                              ))}
                            </div>
                            {companyJobs.length > 4 && (
                              <Button asChild variant="outline" className="mt-4">
                                <Link href={`/jobs?company=${selectedCompany.id}`}>
                                  View All {companyJobs.length} Jobs
                                </Link>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No open positions at this time</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="vendors" className="mt-4">
                        <CompanyVendors companyId={selectedCompany.id} />
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Button
                    onClick={() => setSelectedCompany(null)}
                    variant="ghost"
                    className="mt-4"
                  >
                    Close Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Company Approvals (Admin Only) */}
          {user?.userType === 'admin' && showPendingApprovals && pendingCompanies && pendingCompanies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  Pending Company Approvals ({pendingCompanies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingCompanies.map((company: any) => (
                  <div key={company.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={company.logoUrl || undefined} />
                          <AvatarFallback className="bg-gray-400 text-white">
                            <Building className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg">{company.name}</h4>
                          <p className="text-gray-600">{company.industry}</p>
                          <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => approveCompanyMutation.mutate(company.id)}
                          disabled={approveCompanyMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => rejectCompanyMutation.mutate(company.id)}
                          disabled={rejectCompanyMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {searchQuery ? `Companies matching "${searchQuery}"` : 'All Companies'}
              </h1>
              <p className="text-gray-600">
                {isLoading ? 'Loading...' : `${filteredCompanies.length} companies found`}
              </p>
            </div>
          </div>

          {/* Company Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company: Company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow duration-300 dashboard-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={company.logoUrl || undefined} />
                          <AvatarFallback className="bg-linkedin-blue text-white">
                            <Building className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                            {company.name}
                          </h3>
                          {company.industry && (
                            <p className="text-gray-600 font-medium">
                              {company.industry}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-3 text-sm text-gray-500 mt-2">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{formatFollowerCount(company.followers || 0)} followers</span>
                            </div>
                            {company.size && (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                <span>{company.size}</span>
                              </div>
                            )}
                          </div>

                          {/* Company Address */}
                          {(company.city || company.state || company.country || company.location) && (
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="truncate">
                                {company.location || 
                                 [company.city, company.state, company.zipCode, company.country]
                                   .filter(Boolean)
                                   .join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Company Phone */}
                          {company.phone && (
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                              <Phone className="h-4 w-4 mr-1" />
                              <a href={`tel:${company.phone}`} className="text-linkedin-blue hover:underline">
                                {company.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFollowCompany(company.id)}
                        disabled={followMutation.isPending}
                        className="text-linkedin-blue hover:text-linkedin-dark"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Company Description */}
                    {company.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {company.description}
                      </p>
                    )}

                    {/* Company Details: Open Positions and Vendors */}
                    <CompanyDetails companyId={company.id} />

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          console.log("Selected company:", company);
                          setSelectedCompany(company);
                          // Scroll to top to show selected company details
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleFollowCompany(company.id)}
                        disabled={followMutation.isPending}
                        size="sm"
                        className="bg-linkedin-blue hover:bg-linkedin-dark"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2">
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No companies found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'No companies are currently listed'
                      }
                    </p>
                    {searchQuery && (
                      <Button onClick={() => window.location.href = '/companies'} variant="outline">
                        Clear search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Load More */}
          {filteredCompanies.length > 0 && (
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                Load More Companies
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Company Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Company Page</DialogTitle>
          </DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submit event triggered");
              console.log("Form errors:", companyForm.formState.errors);
              console.log("Form values:", companyForm.getValues());
              companyForm.handleSubmit((data) => {
                console.log("Form validated and submitted with data:", data);
                createCompanyMutation.mutate(data);
              })(e);
            }} className="space-y-4">
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <FormLabel>Company Logo</FormLabel>
                <div className="flex items-center space-x-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-linkedin-blue file:text-white hover:file:bg-linkedin-dark"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload JPG, PNG, or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your company..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={companyForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="California" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={companyForm.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  className="bg-linkedin-blue hover:bg-linkedin-dark"
                  onClick={(e) => {
                    console.log("Submit button clicked");
                    console.log("Form valid:", companyForm.formState.isValid);
                    console.log("Form errors:", companyForm.formState.errors);
                  }}
                >
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Job Creation Dialog for Admins */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Job for {jobFormCompany?.name}</DialogTitle>
            <DialogDescription>
              Create a new job posting for this company
            </DialogDescription>
          </DialogHeader>
          
          <Form {...jobForm}>
            <form 
              onSubmit={jobForm.handleSubmit((data) => {
                createJobMutation.mutate({
                  ...data,
                  companyId: jobFormCompany?.id
                });
              })}
              className="space-y-4"
            >
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

              <FormField
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the role, responsibilities, and company culture..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the required skills, experience, and qualifications..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobForm.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
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
                      <FormLabel>Experience Level *</FormLabel>
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
              </div>

              <FormField
                control={jobForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York, NY or Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobForm.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. $80,000 - $120,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobForm.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma-separated)</FormLabel>
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
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe benefits, perks, and compensation details..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJobForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createJobMutation.isPending ? "Creating..." : "Create Job"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

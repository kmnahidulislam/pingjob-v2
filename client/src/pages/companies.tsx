import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { getDisplayAddress } from "@/utils/addressUtils";
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
  Mail,
  Star,
  Check,
  X,
  Edit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Create a vendor schema for validation
const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  services: z.array(z.string()).min(1, "At least one service is required"),
  companyId: z.number(),
});

// Service options for vendors
const serviceOptions = [
  { value: "ste", label: "Strategic Consulting" },
  { value: "staff", label: "Staff Augmentation" },
  { value: "staffing", label: "Staffing Services" },
  { value: "consulting", label: "Consulting" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
  { value: "support", label: "Support" },
];

// AddVendorButton component
function AddVendorButton({ companyId }: { companyId: number }) {
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      services: [],
      companyId: companyId,
    },
  });

  // Search companies for vendor selection
  const searchCompanies = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching companies:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle company selection
  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    setSearchQuery(company.name);
    setSearchResults([]);
    
    // Auto-populate form fields
    form.setValue("name", company.name);
    if (company.website) {
      const email = company.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      if (email.includes(".")) {
        form.setValue("email", `info@${email}`);
      }
    }
    if (company.phone) {
      form.setValue("phone", company.phone);
    }
  };

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vendorSchema>) => {
      const response = await apiRequest("POST", "/api/vendors", {
        ...data,
        services: data.services.join(","),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/details`] });
      setShowDialog(false);
      form.reset();
      setSelectedCompany(null);
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof vendorSchema>) => {
    createVendorMutation.mutate(data);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchCompanies(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Vendor
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Search */}
              <div className="space-y-2">
                <Label>Search Company</Label>
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a company..."
                    className="w-full"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg">
                    {searchResults.map((company) => (
                      <div
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50 flex-shrink-0">
                            {company.logoUrl && company.logoUrl !== "NULL" ? (
                              <img 
                                src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                                alt={company.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                                {company.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{company.name}</p>
                            {company.industry && (
                              <p className="text-sm text-gray-500 truncate">{company.industry}</p>
                            )}
                            {(company.city || company.state) && (
                              <p className="text-xs text-gray-400 truncate">
                                {[company.city, company.state].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Company Preview */}
              {selectedCompany && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Company</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-white">
                      {selectedCompany.logoUrl && selectedCompany.logoUrl !== "NULL" ? (
                        <img 
                          src={`/${selectedCompany.logoUrl.replace(/ /g, '%20')}`} 
                          alt={selectedCompany.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold">
                          {selectedCompany.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{selectedCompany.name}</p>
                      {selectedCompany.website && (
                        <p className="text-sm text-gray-600">{selectedCompany.website}</p>
                      )}
                      {(selectedCompany.city || selectedCompany.state) && (
                        <p className="text-xs text-gray-500">
                          {[selectedCompany.city, selectedCompany.state, selectedCompany.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter vendor name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Services */}
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {serviceOptions.map((service) => (
                          <div key={service.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.value}
                              checked={field.value.includes(service.value)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  field.onChange([...field.value, service.value]);
                                } else {
                                  field.onChange(field.value.filter((v) => v !== service.value));
                                }
                              }}
                            />
                            <Label htmlFor={service.value} className="text-sm">
                              {service.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createVendorMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createVendorMutation.isPending ? "Adding..." : "Add Vendor"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Company Card Component
function CompanyCard({ company, onSelectCompany, onFollowCompany }: {
  company: any;
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
}) {
  const handleClick = () => {
    console.log("View clicked for company:", company.name);
    onSelectCompany(company);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Company Logo */}
          <div className="w-20 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            {company.logoUrl && company.logoUrl !== "NULL" ? (
              <img 
                src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                alt={company.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold text-lg">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Company Name */}
          <h3 className="font-semibold text-base text-gray-900 line-clamp-3 min-h-[60px] flex items-center text-center leading-tight">
            {company.name}
          </h3>
          
          {/* Industry */}
          {company.industry && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {company.industry}
            </p>
          )}
          
          {/* Location with Zip Code */}
          {(company.city || company.state || company.zipCode || company.zip_code || company.country) && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate text-center">
                {[company.city, company.state, company.zipCode || company.zip_code, company.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {/* Stats */}
          <div className="flex flex-col items-center space-y-2 w-full">
            {(company.job_count || 0) > 0 && (
              <div className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="text-sm">{company.job_count} Open Job{company.job_count !== 1 ? 's' : ''}</span>
              </div>
            )}
            {(company.vendor_count || 0) > 0 && (
              <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">{company.vendor_count} Vendor{company.vendor_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {/* Follow Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onFollowCompany(company.id);
            }}
            variant="outline"
            size="sm"
            className="w-full mt-auto opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="h-4 w-4 mr-2" />
            Follow Company
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Search Results Component
function SearchResults({ companies, onSelectCompany, onFollowCompany }: {
  companies: any[];
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No companies found</p>
        <p className="text-sm mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {companies.map((company: any) => (
        <CompanyCard
          key={company.id}
          company={company}
          onSelectCompany={onSelectCompany}
          onFollowCompany={onFollowCompany}
        />
      ))}
    </div>
  );
}

// Company Details Modal Component
function CompanyDetailsModal({ company, isOpen, onClose }: {
  company: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: companyDetails } = useQuery({
    queryKey: [`/api/companies/${company?.id}/details`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/companies/${company.id}/details`);
      return response.json();
    },
    enabled: !!company
  });

  // Check if user is admin
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-gray-50">
              {company.logoUrl && company.logoUrl !== "NULL" ? (
                <img 
                  src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                  alt={company.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Statistics */}
          {(companyDetails?.openJobs?.length > 0 || companyDetails?.vendors?.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Company Activity</h4>
              <div className="flex items-center space-x-6">
                {companyDetails?.openJobs?.length > 0 && (
                  <div className="flex items-center text-green-600">
                    <Briefcase className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {companyDetails.openJobs.length} Open Job{companyDetails.openJobs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {companyDetails?.vendors?.length > 0 && (
                  <div className="flex items-center text-blue-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {companyDetails.vendors.length} Vendor{companyDetails.vendors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Industry</h4>
              <p className="text-gray-600">{company.industry || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Location</h4>
              <p className="text-gray-600">{getDisplayAddress(company) || 'Not specified'}</p>
            </div>
            {company.website && (
              <div>
                <h4 className="font-semibold mb-2">Website</h4>
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-linkedin-blue hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div>
                <h4 className="font-semibold mb-2">Phone</h4>
                <a href={`tel:${company.phone}`} className="text-linkedin-blue hover:underline">
                  {company.phone}
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {company.description && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-gray-700 leading-relaxed">{company.description}</p>
            </div>
          )}

          {/* Tabs for Jobs and Vendors */}
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs">
                Jobs ({companyDetails?.openJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="vendors">
                Vendors ({companyDetails?.vendors?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="space-y-4">
              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div>
                    <h4 className="font-semibold text-blue-900">Admin Actions</h4>
                    <p className="text-sm text-blue-700">Post jobs for this company</p>
                  </div>
                  <Link href={`/job-create?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Post a Job
                    </Button>
                  </Link>
                </div>
              )}
              
              {companyDetails?.openJobs && companyDetails.openJobs.length > 0 ? (
                <div className="space-y-4">
                  {companyDetails.openJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No open positions</p>
                  {isAdmin && (
                    <p className="text-sm mt-2 text-blue-600">Use "Post a Job" above to create the first job for this company</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="vendors" className="space-y-4">
              {/* Admin Actions for Vendors */}
              {isAdmin && (
                <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-200">
                  <div>
                    <h4 className="font-semibold text-green-900">Admin Actions</h4>
                    <p className="text-sm text-green-700">Add vendors for this company</p>
                  </div>
                  <AddVendorButton companyId={company.id} />
                </div>
              )}
              
              {companyDetails?.vendors && companyDetails.vendors.length > 0 ? (
                <div className="space-y-4">
                  {companyDetails.vendors.map((vendor: any) => (
                    <Card key={vendor.vendor_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{vendor.vendor_name}</h4>
                            <p className="text-sm text-gray-600">{vendor.service_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              {vendor.city && vendor.state && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {vendor.city}, {vendor.state} {vendor.zip_code}
                                </div>
                              )}
                              {vendor.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-4 w-4" />
                                  <a 
                                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-linkedin-blue hover:underline"
                                  >
                                    {vendor.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No vendors registered</p>
                  {isAdmin && (
                    <p className="text-sm mt-2 text-green-600">Use "Add Vendor" above to add the first vendor for this company</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Companies Page Component
export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get search query from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || "";

  const companiesPerPage = 20;
  const totalPages = 5; // 100 companies / 20 per page = 5 pages

  // Load top 100 companies prioritized by vendor and job count
  const { data: topCompanies = [], isLoading } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies/top');
      return response.json();
    }
  });

  // Search companies when query is provided
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Follow company mutation
  const followMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest('POST', `/api/companies/${companyId}/follow`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company followed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/top'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow company",
        variant: "destructive",
      });
    },
  });

  // Get current page companies
  const currentCompanies = topCompanies.slice(
    (currentPage - 1) * companiesPerPage,
    currentPage * companiesPerPage
  );

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
  };

  const handleFollowCompany = (companyId: number) => {
    followMutation.mutate(companyId);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header - Logo Only */}
      <div className="flex items-center mb-8">
        <Link href="/">
          <img 
            src={logoPath} 
            alt="PingJob"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>



      {/* Search Results or Company Grid */}
      {searchQuery && searchQuery.length >= 2 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Search Results for "{searchQuery}"</CardTitle>
              <Button
                onClick={() => window.location.href = '/companies'}
                variant="outline"
                size="sm"
              >
                Clear Search
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SearchResults
              companies={searchResults?.companies || []}
              onSelectCompany={handleSelectCompany}
              onFollowCompany={handleFollowCompany}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Top Companies ({topCompanies.length} total)
              </CardTitle>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(20)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="w-16 h-12 bg-gray-200 rounded mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : currentCompanies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {currentCompanies.map((company: any) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onSelectCompany={handleSelectCompany}
                      onFollowCompany={handleFollowCompany}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-8">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies available</h3>
                <p className="text-gray-600">Companies will appear here once they are approved</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
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
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Company Logo */}
          <div className="w-16 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            {company.logoUrl && company.logoUrl !== "NULL" ? (
              <img 
                src={company.logoUrl} 
                alt={company.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold text-sm">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Company Name */}
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 min-h-[40px] flex items-center">
            {company.name}
          </h3>
          
          {/* Industry */}
          {company.industry && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {company.industry}
            </p>
          )}
          
          {/* Location */}
          {(company.city || company.state || company.country) && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">
                {[company.city, company.state, company.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
            {(company.vendor_count || 0) > 0 && (
              <div className="flex items-center">
                <Building className="h-3 w-3 mr-1" />
                <span>{company.vendor_count}</span>
              </div>
            )}
            {(company.job_count || 0) > 0 && (
              <div className="flex items-center">
                <Briefcase className="h-3 w-3 mr-1" />
                <span>{company.job_count}</span>
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
            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="h-3 w-3 mr-1" />
            Follow
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
      <div className="text-center py-8">
        <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No companies found</h3>
        <p className="text-gray-600">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                {company.logoUrl && company.logoUrl !== "NULL" ? (
                  <img 
                    src={company.logoUrl} 
                    alt={company.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold text-lg">
                    {company.name.charAt(0)}
                  </div>
                )}
              </div>
              
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
                        {getDisplayAddress(company)}
                      </div>
                      {(company.vendor_count || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {company.vendor_count} vendors
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollowCompany(company.id);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
  const { data: companyDetails } = useQuery({
    queryKey: [`/api/companies/${company?.id}/details`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/companies/${company.id}/details`);
      return response.json();
    },
    enabled: !!company
  });

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-gray-50">
              {company.logoUrl && company.logoUrl !== "NULL" ? (
                <img 
                  src={company.logoUrl} 
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
            
            <TabsContent value="jobs" className="mt-4">
              {companyDetails?.openJobs && companyDetails.openJobs.length > 0 ? (
                <div className="space-y-4">
                  {companyDetails.openJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} compact showCompany={false} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No open positions at this time</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="vendors" className="mt-4">
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
                              {vendor.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  <a href={`mailto:${vendor.email}`} className="text-linkedin-blue hover:underline">
                                    {vendor.email}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      const response = await apiRequest('GET', `/api/search/${encodeURIComponent(searchQuery)}`);
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow company",
        variant: "destructive",
      });
    },
  });

  const handleFollowCompany = (companyId: number) => {
    followMutation.mutate(companyId);
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * companiesPerPage;
  const endIndex = startIndex + companiesPerPage;
  const currentCompanies = topCompanies.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
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
            <CardTitle>Search Results</CardTitle>
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
        <>
          {/* Company Grid */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
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
        </>
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
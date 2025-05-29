import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JobCard from "@/components/job-card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema } from "@shared/schema";
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
import type { Company } from "@/lib/types";

const companyFormSchema = insertCompanySchema.extend({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(1, "Description is required"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
});

export default function Companies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies');
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
      size: "1-10",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyData: z.infer<typeof companyFormSchema>) =>
      apiRequest('POST', '/api/companies', companyData),
    onSuccess: () => {
      toast({
        title: "Company submitted for approval",
        description: "Your company will be reviewed by our team and approved shortly"
      });
      setShowCreateForm(false);
      companyForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating company",
        description: error.message || "Failed to create company",
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };

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

  const filteredCompanies = companies?.filter((company: Company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
                      onClick={() => setSearchQuery(industry)}
                    >
                      {industry}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Create Company (for clients) */}
              {user?.userType === 'client' && !userCompany && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-linkedin-blue hover:bg-linkedin-dark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company Page
                </Button>
              )}
            </CardContent>
          </Card>
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
                    placeholder="Search companies, industries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="bg-linkedin-blue hover:bg-linkedin-dark">
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Company Details Modal/Sidebar */}
          {selectedCompany && (
            <Card className="mb-6">
              <CardContent className="p-0">
                {/* Company Header */}
                <div className="h-32 bg-gradient-to-r from-linkedin-blue to-linkedin-light"></div>
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
                      <h3 className="font-semibold text-lg mb-2">About</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCompany.description}
                      </p>
                    </div>
                  )}

                  {/* Company Jobs */}
                  {companyJobs && companyJobs.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Open Positions ({companyJobs.length})
                      </h3>
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
                  )}

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

                    {/* Company Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          1,245 views
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          12 jobs
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedCompany(company)}
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
                      <Button onClick={() => setSearchQuery("")} variant="outline">
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
    </div>
  );
}

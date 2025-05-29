import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building, Check, X, Plus, Users, Briefcase, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedVendorCompany, setSelectedVendorCompany] = useState<any>(null);
  const [vendorComboOpen, setVendorComboOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch pending companies
  const { data: pendingCompanies = [], isLoading: loadingPending } = useQuery({
    queryKey: ['/api/companies/pending'],
  });

  // Fetch approved companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Fetch dashboard stats
  const { data: stats = {} } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Approve/Reject company mutation
  const companyStatusMutation = useMutation({
    mutationFn: async ({ companyId, status }: { companyId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/companies/${companyId}/status`, { status, approvedBy: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Company status updated",
        description: "The company status has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company status.",
        variant: "destructive",
      });
    },
  });

  // Add vendor mutation
  const addVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      return await apiRequest('POST', '/api/vendors', vendorData);
    },
    onSuccess: () => {
      setVendorDialogOpen(false);
      setSelectedCompany(null);
      toast({
        title: "Vendor added",
        description: "Vendor has been successfully added to the company.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add vendor.",
        variant: "destructive",
      });
    },
  });

  const handleApproveCompany = (companyId: number) => {
    companyStatusMutation.mutate({ companyId, status: 'approved' });
  };

  const handleRejectCompany = (companyId: number) => {
    companyStatusMutation.mutate({ companyId, status: 'rejected' });
  };

  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedVendorCompany) {
      toast({
        title: "Error",
        description: "Please select a vendor company.",
        variant: "destructive",
      });
      return;
    }
    
    addVendorMutation.mutate({
      companyId: selectedCompany,
      name: selectedVendorCompany.name,
      email: formData.get('email'),
      phone: formData.get('phone'),
      services: formData.get('services'),
      description: formData.get('description'),
      status: 'active',
    });
  };

  // Company Vendors Component
  function CompanyVendors({ companyId }: { companyId: number }) {
    const { data: vendors, isLoading } = useQuery({
      queryKey: ['/api/companies', companyId, 'vendors'],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/companies/${companyId}/vendors`);
        return response;
      },
    });

    if (isLoading) {
      return <div className="text-sm text-gray-500 mt-2">Loading vendors...</div>;
    }

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return <div className="text-sm text-gray-500 mt-2">No vendors added yet</div>;
    }

    return (
      <div className="mt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Vendors ({vendors.length})</h4>
        <div className="space-y-1">
          {vendors.map((vendor: any) => (
            <div key={vendor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div className="flex-1">
                <span className="font-medium">{vendor.name}</span>
                <span className="text-gray-500 ml-2">• {vendor.services}</span>
              </div>
              <Badge 
                variant={vendor.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {vendor.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage companies, vendors, and platform settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Approved companies</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCompanies.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="companies">Company Management</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6">
          {/* Pending Companies */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Company Approvals</CardTitle>
              <CardDescription>
                Review and approve companies waiting for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8">Loading pending companies...</div>
              ) : pendingCompanies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending companies to review
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCompanies.map((company: any) => (
                    <div key={company.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <p className="text-gray-600">{company.industry}</p>
                          <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{company.location}</span>
                            <span>{company.size} employees</span>
                            {company.website && (
                              <a href={company.website} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">
                                {company.website}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveCompany(company.id)}
                            disabled={companyStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectCompany(company.id)}
                            disabled={companyStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved Companies */}
          <Card>
            <CardHeader>
              <CardTitle>Approved Companies</CardTitle>
              <CardDescription>
                Manage approved companies and their vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="text-center py-8">Loading companies...</div>
              ) : (
                <div className="space-y-4">
                  {companies.map((company: any) => (
                    <div key={company.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{company.name}</h3>
                            <Badge variant="secondary">Approved</Badge>
                          </div>
                          <p className="text-gray-600">{company.industry}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{company.followers} followers</span>
                            <span>{company.location}</span>
                          </div>
                          <CompanyVendors companyId={company.id} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCompany(company.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Vendor
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Vendor to {company.name}</DialogTitle>
                                <DialogDescription>
                                  Add a new vendor or service provider for this company.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAddVendor}>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="vendorCompany" className="text-right">
                                      Vendor Company
                                    </Label>
                                    <div className="col-span-3">
                                      <Popover open={vendorComboOpen} onOpenChange={setVendorComboOpen}>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={vendorComboOpen}
                                            className="w-full justify-between"
                                          >
                                            {selectedVendorCompany
                                              ? selectedVendorCompany.name
                                              : "Select vendor company..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                          <Command>
                                            <CommandInput placeholder="Search companies..." />
                                            <CommandEmpty>No company found.</CommandEmpty>
                                            <CommandGroup>
                                              {companies.map((comp: any) => (
                                                <CommandItem
                                                  key={comp.id}
                                                  value={comp.name}
                                                  onSelect={() => {
                                                    setSelectedVendorCompany(comp);
                                                    setVendorComboOpen(false);
                                                  }}
                                                >
                                                  <CheckIcon
                                                    className={`mr-2 h-4 w-4 ${
                                                      selectedVendorCompany?.id === comp.id ? "opacity-100" : "opacity-0"
                                                    }`}
                                                  />
                                                  <div>
                                                    <div className="font-medium">{comp.name}</div>
                                                    <div className="text-sm text-gray-500">{comp.industry}</div>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">
                                      Email
                                    </Label>
                                    <Input
                                      id="email"
                                      name="email"
                                      type="email"
                                      placeholder="contact@vendor.com"
                                      className="col-span-3"
                                      required
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-right">
                                      Phone
                                    </Label>
                                    <Input
                                      id="phone"
                                      name="phone"
                                      placeholder="+1 (555) 123-4567"
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="services" className="text-right">
                                      Services
                                    </Label>
                                    <Input
                                      id="services"
                                      name="services"
                                      placeholder="IT Support, Consulting"
                                      className="col-span-3"
                                      required
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">
                                      Description
                                    </Label>
                                    <Textarea
                                      id="description"
                                      name="description"
                                      placeholder="Brief description of vendor services"
                                      className="col-span-3"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={addVendorMutation.isPending}>
                                    {addVendorMutation.isPending ? "Adding..." : "Add Vendor"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>
                Manage all vendors across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Vendor management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Building, 
  Check, 
  X, 
  Plus, 
  Users, 
  Briefcase, 
  TrendingUp, 
  User, 
  FileText, 
  Calendar,
  MapPin,
  Clock,
  Target,
  Award,
  BookOpen,
  Eye,
  Send,
  Heart,
  Star,
  ChevronsUpDown
} from "lucide-react";
import { Link } from "wouter";

// Job Seeker Dashboard Component
function JobSeekerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile data
  const { data: profile = {} } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch user applications
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/applications'],
    enabled: !!user?.id,
  });

  // Fetch recommended jobs
  const { data: recommendedJobs = [] } = useQuery({
    queryKey: ['/api/jobs', { limit: 6 }],
  });

  // Fetch user skills
  const { data: skills = [] } = useQuery({
    queryKey: [`/api/skills/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch user experience
  const { data: experience = [] } = useQuery({
    queryKey: [`/api/experience/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch user education
  const { data: education = [] } = useQuery({
    queryKey: [`/api/education/${user?.id}`],
    enabled: !!user?.id,
  });

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 7;

    if ((profile as any)?.first_name && (profile as any)?.last_name) completed++;
    if ((profile as any)?.email) completed++;
    if ((profile as any)?.phone) completed++;
    if ((profile as any)?.location) completed++;
    if (Array.isArray(skills) && skills.length > 0) completed++;
    if (Array.isArray(experience) && experience.length > 0) completed++;
    if (Array.isArray(education) && education.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Get application statistics
  const getApplicationStats = () => {
    const appArray = Array.isArray(applications) ? applications : [];
    const total = appArray.length;
    const applied = appArray.filter((app: any) => app.status === 'applied' || app.status === 'pending').length;
    const interviews = appArray.filter((app: any) => app.status === 'interview').length;
    const offers = appArray.filter((app: any) => app.status === 'offered').length;

    return { total, applied, interviews, offers };
  };

  const stats = getApplicationStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600">
          Here's your job search progress and recommendations.
        </p>
      </div>

      {/* Profile Completion Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            A complete profile gets 5x more views from recruiters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-gray-600">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="mb-4" />
          {profileCompletion < 100 && (
            <div className="flex gap-2">
              <Link href="/profile">
                <Button size="sm">Complete Profile</Button>
              </Link>
              <span className="text-sm text-gray-600 self-center">
                Add missing information to stand out to employers
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold">{stats.applied}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interviews</p>
                <p className="text-2xl font-bold">{stats.interviews}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Job Offers</p>
                <p className="text-2xl font-bold">{stats.offers}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Job Recommendations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Recommended Jobs
              </CardTitle>
              <CardDescription>
                Jobs matching your skills and experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(recommendedJobs) && recommendedJobs.slice(0, 4).map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <Badge variant="secondary">{job.employmentType}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{job.company?.name || 'Company Name'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {job.salary}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {job.description?.substring(0, 120)}...
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-1" />
                        Quick Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/jobs">
                  <Button variant="outline">View All Jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(applications) && applications.slice(0, 3).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{app.jobTitle}</p>
                      <p className="text-xs text-gray-600">{app.companyName}</p>
                    </div>
                    <Badge 
                      variant={
                        app.status === 'applied' || app.status === 'pending' ? 'secondary' :
                        app.status === 'interview' ? 'default' :
                        app.status === 'offered' ? 'default' : 'destructive'
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/applications">
                  <Button variant="outline" size="sm">View All Applications</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/jobs">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
              <Link href="/companies">
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Explore Companies
                </Button>
              </Link>
              <Link href="/connections">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  My Network
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Skills Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 6).map((skill: any) => (
                  <Badge key={skill.id} variant="outline">
                    {skill.name}
                  </Badge>
                ))}
                {skills.length > 6 && (
                  <Badge variant="secondary">+{skills.length - 6} more</Badge>
                )}
              </div>
              {skills.length === 0 && (
                <p className="text-sm text-gray-600">
                  Add skills to your profile to get better job recommendations
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component (existing functionality)
function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedVendorCompany, setSelectedVendorCompany] = useState<any>(null);
  const [vendorComboOpen, setVendorComboOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  // Fetch pending companies
  const { data: pendingCompanies = [], isLoading: loadingPending } = useQuery({
    queryKey: ['/api/companies/pending'],
  });

  // Fetch sample of approved companies for dashboard display
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/companies', { limit: 100 }],
    queryFn: async () => {
      const response = await fetch('/api/companies?limit=100');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
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

  // Vendor Approvals Component
  function VendorApprovals() {
    const { toast } = useToast();
    
    const { data: pendingVendors, isLoading: loadingVendors } = useQuery({
      queryKey: ['/api/admin/vendors/pending'],
      queryFn: async () => {
        const response = await apiRequest('GET', '/api/admin/vendors/pending');
        return await response.json();
      },
    });

    const vendorStatusMutation = useMutation({
      mutationFn: async ({ vendorId, status }: { vendorId: number; status: 'approved' | 'rejected' }) => {
        return await apiRequest('PATCH', `/api/admin/vendors/${vendorId}/status`, { status });
      },
      onSuccess: () => {
        toast({
          title: "Vendor status updated",
          description: "The vendor status has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors/pending'] });
      },
      onError: (error: any) => {
        toast({
          title: "Error updating vendor status",
          description: error.message || "Failed to update vendor status",
          variant: "destructive",
        });
      },
    });

    const handleApproveVendor = (vendorId: number) => {
      vendorStatusMutation.mutate({ vendorId, status: 'approved' });
    };

    const handleRejectVendor = (vendorId: number) => {
      vendorStatusMutation.mutate({ vendorId, status: 'rejected' });
    };

    if (loadingVendors) {
      return <div className="text-center py-8">Loading pending vendors...</div>;
    }

    if (!pendingVendors || pendingVendors.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No pending vendor approvals</p>
          <p className="text-sm mt-2">All vendors have been reviewed</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pendingVendors.map((vendor: any) => (
          <div key={vendor.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{vendor.name}</h3>
                <p className="text-gray-600">{vendor.email}</p>
                <p className="text-sm text-gray-500 mt-1">{vendor.services}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Company: {vendor.company?.name}</span>
                  {vendor.phone && <span>Phone: {vendor.phone}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApproveVendor(vendor.id)}
                  disabled={vendorStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRejectVendor(vendor.id)}
                  disabled={vendorStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
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
          <TabsTrigger value="vendors">Vendor Approvals</TabsTrigger>
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
              <CardTitle>Vendor Approvals</CardTitle>
              <CardDescription>
                Review and approve pending vendor registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorApprovals />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Dashboard Component - Routes based on user role
export default function Dashboard() {
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';

  // Route to appropriate dashboard based on user role
  if (isAdmin) {
    return <AdminDashboard />;
  } else {
    return <JobSeekerDashboard />;
  }
}
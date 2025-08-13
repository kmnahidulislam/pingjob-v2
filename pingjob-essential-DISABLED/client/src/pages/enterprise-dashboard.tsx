import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Briefcase, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Users,
  Building,
  Star,
  Search
} from "lucide-react";

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewCandidatesOpen, setIsViewCandidatesOpen] = useState(false);
  const [viewingCandidates, setViewingCandidates] = useState<any[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "full_time",
    employmentType: "full_time",
    experienceLevel: "mid",
    salary: "",
    companyId: "",
    categoryId: ""
  });

  // Fetch enterprise's own jobs (unlimited)
  const { data: enterpriseJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/enterprise/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/enterprise/jobs');
      return response.json();
    },
    enabled: user?.userType === 'client'
  });

  // Fetch all job seekers for enterprise access
  const { data: allJobSeekers = [], isLoading: seekersLoading } = useQuery({
    queryKey: ['/api/enterprise/job-seekers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/enterprise/job-seekers');
      return response.json();
    },
    enabled: user?.userType === 'client'
  });

  // Fetch companies for job creation
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies'],
    queryFn: async () => {
      const response = await fetch('/api/companies?limit=1000');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      return response.json();
    }
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest('POST', '/api/enterprise/jobs', jobData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      setIsCreateJobOpen(false);
      setNewJob({
        title: "",
        description: "",
        requirements: "",
        location: "",
        jobType: "full_time",
        employmentType: "full_time",
        experienceLevel: "mid",
        salary: "",
        companyId: "",
        categoryId: ""
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    }
  });

  // Edit job mutation
  const editJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest('PATCH', `/api/jobs/${jobData.id}`, jobData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update job');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      setIsEditJobOpen(false);
      setEditingJob(null);
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await apiRequest('DELETE', `/api/jobs/${jobId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete job');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    }
  });

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.companyId || !newJob.categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const jobData = {
      ...newJob,
      companyId: parseInt(newJob.companyId),
      categoryId: parseInt(newJob.categoryId)
    };

    createJobMutation.mutate(jobData);
  };

  const handleEditJob = (job: any) => {
    setEditingJob({
      ...job,
      companyId: job.companyId?.toString() || "",
      categoryId: job.categoryId?.toString() || ""
    });
    setIsEditJobOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!editingJob.title || !editingJob.description || !editingJob.companyId || !editingJob.categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const jobData = {
      ...editingJob,
      companyId: parseInt(editingJob.companyId),
      categoryId: parseInt(editingJob.categoryId)
    };

    editJobMutation.mutate(jobData);
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  // View candidates for a job
  const viewCandidates = async (jobId: number, jobTitle: string) => {
    try {
      const response = await apiRequest('GET', `/api/enterprise/jobs/${jobId}/candidates`);
      const candidates = await response.json();
      
      setViewingCandidates(candidates);
      setSelectedJobTitle(jobTitle);
      setIsViewCandidatesOpen(true);
      
      if (candidates.length === 0) {
        toast({
          title: "Info",
          description: "No candidates have been assigned to this job yet.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    }
  };

  // Filter job seekers based on search query
  const filteredJobSeekers = allJobSeekers.filter((seeker: any) => {
    const query = searchQuery.toLowerCase();
    return (
      seeker.firstName?.toLowerCase().includes(query) ||
      seeker.lastName?.toLowerCase().includes(query) ||
      seeker.email?.toLowerCase().includes(query) ||
      seeker.headline?.toLowerCase().includes(query) ||
      seeker.location?.toLowerCase().includes(query)
    );
  });

  if (!user || user.userType !== 'client') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need an enterprise account to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.firstName}!</p>
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{enterpriseJobs.length}</span> jobs posted
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Unlimited Posting
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            <TabsTrigger value="candidates">All Job Seekers</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            {/* Job Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Create New Job</span>
                  <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Job</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Job Title</label>
                            <Input
                              value={newJob.title}
                              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                              placeholder="e.g., Senior Software Engineer"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Company</label>
                            <Select value={newJob.companyId} onValueChange={(value) => setNewJob({ ...newJob, companyId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company: any) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Select value={newJob.categoryId} onValueChange={(value) => setNewJob({ ...newJob, categoryId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <Input
                              value={newJob.location}
                              onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                              placeholder="e.g., New York, NY"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Job Description</label>
                          <Textarea
                            value={newJob.description}
                            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                            placeholder="Describe the role and responsibilities..."
                            rows={4}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Requirements</label>
                          <Textarea
                            value={newJob.requirements}
                            onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                            placeholder="List required skills and qualifications..."
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={() => setIsCreateJobOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateJob} disabled={createJobMutation.isPending}>
                            {createJobMutation.isPending ? "Creating..." : "Create Job"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Jobs List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : enterpriseJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first job posting.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enterpriseJobs.map((job: any) => (
                      <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{job.title}</h3>
                            <p className="text-sm text-gray-600">{job.company?.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline">{job.jobType}</Badge>
                              <Badge variant="outline">{job.experienceLevel}</Badge>
                              <span className="text-sm text-gray-500">
                                Created {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewCandidates(job.id, job.title)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Candidates
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJob(job)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Job Seekers ({allJobSeekers.length})</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-80"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {seekersLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredJobSeekers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ? "Try adjusting your search query." : "No job seekers available."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobSeekers.map((seeker: any) => {
                      const categoryName = categories.find((cat: any) => cat.id === seeker.categoryId)?.name || 'Unknown Category';
                      return (
                        <div key={seeker.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">
                                {seeker.firstName} {seeker.lastName}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{seeker.email}</p>
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {categoryName}
                              </Badge>
                              {seeker.headline && (
                                <p className="text-sm text-gray-500 mt-1">{seeker.headline}</p>
                              )}
                              {seeker.location && (
                                <p className="text-xs text-gray-400 mt-1">{seeker.location}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`mailto:${seeker.email}`}>
                                <Mail className="h-4 w-4 mr-1" />
                                Contact
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Job Dialog */}
        <Dialog open={isEditJobOpen} onOpenChange={setIsEditJobOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            {editingJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title</label>
                    <Input
                      value={editingJob.title}
                      onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <Select value={editingJob.companyId} onValueChange={(value) => setEditingJob({ ...editingJob, companyId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select value={editingJob.categoryId} onValueChange={(value) => setEditingJob({ ...editingJob, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <Input
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Job Description</label>
                  <Textarea
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    placeholder="Describe the role and responsibilities..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Requirements</label>
                  <Textarea
                    value={editingJob.requirements}
                    onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                    placeholder="List required skills and qualifications..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditJobOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateJob} disabled={editJobMutation.isPending}>
                    {editJobMutation.isPending ? "Updating..." : "Update Job"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Candidates Dialog */}
        <Dialog open={isViewCandidatesOpen} onOpenChange={setIsViewCandidatesOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Candidates for: {selectedJobTitle}</DialogTitle>
              <DialogDescription>
                Category-matched candidates assigned to this job
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {viewingCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">Candidates are auto-assigned when creating jobs with categories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingCandidates.map((candidate: any) => (
                    <div key={candidate.candidateId} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">
                            {candidate.candidateName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{candidate.candidateEmail}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${candidate.candidateEmail}`}>
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Briefcase, 
  Users, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Plus,
  Eye,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Building
} from "lucide-react";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "full-time",
    experienceLevel: "mid-level",
    salary: "",
    companyId: "",
    categoryId: ""
  });

  // Fetch recruiter's own jobs
  const { data: recruiterJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/recruiter/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recruiter/jobs');
      return response.json();
    },
    enabled: user?.userType === 'recruiter'
  });

  // Fetch companies for job creation
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies/search'],
    queryFn: async () => {
      const response = await fetch('/api/companies/search?q=');
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

  // Fetch candidates for selected job
  const { data: jobCandidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/recruiter/jobs', selectedJob?.id, 'candidates'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/recruiter/jobs/${selectedJob.id}/candidates`);
      return response.json();
    },
    enabled: !!selectedJob?.id && user?.userType === 'recruiter'
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest('POST', '/api/recruiter/jobs', jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Created",
        description: "Job posted successfully and candidates auto-assigned by category",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
      setIsCreateJobOpen(false);
      setNewJob({
        title: "",
        description: "",
        requirements: "",
        location: "",
        jobType: "full-time",
        experienceLevel: "mid-level",
        salary: "",
        companyId: "",
        categoryId: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    }
  });

  // Update assignment status mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, status, notes }: any) => {
      const response = await apiRequest('PATCH', `/api/recruiter/assignments/${assignmentId}`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Candidate assignment status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs', selectedJob?.id, 'candidates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Connect with candidate mutation
  const connectMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const response = await apiRequest('POST', `/api/recruiter/connect/${candidateId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Created",
        description: "Successfully connected with candidate",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect with candidate",
        variant: "destructive",
      });
    }
  });

  const handleCreateJob = () => {
    if (!newJob.title || !newJob.companyId || !newJob.categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, company, and category",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate(newJob);
  };

  const handleUpdateAssignment = (assignmentId: number, status: string, notes?: string) => {
    updateAssignmentMutation.mutate({ assignmentId, status, notes });
  };

  const handleConnect = (candidateId: string) => {
    connectMutation.mutate(candidateId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.userType !== 'recruiter') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">This page is only accessible to recruiters.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your job postings and candidate assignments</p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">My Jobs ({recruiterJobs.length})</TabsTrigger>
          <TabsTrigger value="candidates">Assigned Candidates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Job Postings</h2>
            <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Job Title</label>
                      <Input
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <Input
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        placeholder="e.g. New York, NY"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Company</label>
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
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Job Type</label>
                      <Select value={newJob.jobType} onValueChange={(value) => setNewJob({ ...newJob, jobType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Experience Level</label>
                      <Select value={newJob.experienceLevel} onValueChange={(value) => setNewJob({ ...newJob, experienceLevel: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry-level">Entry Level</SelectItem>
                          <SelectItem value="mid-level">Mid Level</SelectItem>
                          <SelectItem value="senior-level">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Salary</label>
                      <Input
                        value={newJob.salary}
                        onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                        placeholder="e.g. $80,000 - $120,000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description</label>
                    <Textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and company culture..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Requirements</label>
                    <Textarea
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                      placeholder="List required skills, experience, and qualifications..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
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
          </div>

          <div className="grid gap-6">
            {jobsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recruiterJobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600 mb-4">Create your first job posting to start finding candidates</p>
                  <Button onClick={() => setIsCreateJobOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              recruiterJobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <Badge variant="secondary">{job.jobType}</Badge>
                          <Badge variant="outline">{job.experienceLevel}</Badge>
                        </div>
                        <div className="flex items-center text-gray-600 space-x-4 mb-3">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {job.company?.name || 'Company'}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                        {job.salary && (
                          <div className="text-green-600 font-medium mb-4">{job.salary}</div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button 
                          onClick={() => setSelectedJob(job)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Candidates
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-6">
          {selectedJob ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Assigned Candidates</h2>
                <p className="text-gray-600">Candidates auto-assigned to: {selectedJob.title}</p>
              </div>

              <div className="grid gap-4">
                {candidatesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : jobCandidates.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates assigned</h3>
                      <p className="text-gray-600">Candidates will be auto-assigned based on category matching</p>
                    </CardContent>
                  </Card>
                ) : (
                  jobCandidates.map((assignment: any) => (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={assignment.candidate.profileImageUrl} />
                              <AvatarFallback>
                                {assignment.candidate.firstName?.[0]}{assignment.candidate.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">
                                {assignment.candidate.firstName} {assignment.candidate.lastName}
                              </h4>
                              <p className="text-gray-600">{assignment.candidate.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getStatusColor(assignment.status)}>
                                  {assignment.status?.replace('_', ' ') || 'assigned'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Score: {assignment.resumeScore || 'N/A'}/10
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnect(assignment.candidate.id)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                            <Select
                              value={assignment.status || 'assigned'}
                              onValueChange={(value) => handleUpdateAssignment(assignment.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interested">Interested</SelectItem>
                                <SelectItem value="not_interested">Not Interested</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {assignment.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{assignment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job to view candidates</h3>
                <p className="text-gray-600">Go to the "My Jobs" tab and click "View Candidates" on any job</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recruiterJobs.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recruiterJobs.reduce((acc: number, job: any) => acc + (job.candidateCount || 0), 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
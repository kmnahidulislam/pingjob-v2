import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
  FileText,
  Download
} from "lucide-react";

// Job Applications Component for Recruiters
function JobApplicationsSection() {
  const { toast } = useToast();
  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/job-applications/for-recruiters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/job-applications/for-recruiters');
      return response.json();
    }
  });

  // Create test application
  const createTestApplication = async () => {
    try {
      const response = await apiRequest('POST', '/api/test/create-application');
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Test Application Created",
          description: `Created application with ID: ${result.applicationId}`,
        });
        refetch(); // Refresh the applications
      } else {
        throw new Error('Failed to create test application');
      }
    } catch (error) {
      console.error('Error creating test application:', error);
      toast({
        title: "Error",
        description: "Failed to create test application",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
        <p className="mt-1 text-sm text-gray-500">Job applications will appear here when job seekers apply.</p>
        
        {/* Temporary test button for debugging */}
        <div className="mt-4">
          <Button onClick={createTestApplication} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Test Application (Debug)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">All Job Applications ({applications.length})</h3>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary">{applications.length} Total Resumes</Badge>
          {/* Debug button always visible */}
          <Button onClick={createTestApplication} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Test Application (Debug)
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {applications.map((app: any) => (
          <div key={app.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-lg">{app.applicantName}</h4>
                  {app.matchScore > 0 && (
                    <Badge variant="secondary">Score: {app.matchScore}/12</Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Job:</strong> {app.jobTitle}</p>
                  <p><strong>Company:</strong> {app.companyName}</p>
                  <p><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>
                  <p><strong>Email:</strong> {app.applicantEmail}</p>
                </div>
                
                {app.coverLetter && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Cover Letter:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                      {app.coverLetter.length > 150 
                        ? `${app.coverLetter.substring(0, 150)}...` 
                        : app.coverLetter
                      }
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {app.resumeUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      const filename = app.resumeUrl.replace('/uploads/', '').replace('uploads/', '');
                      const downloadUrl = `/api/resume/${filename}`;
                      console.log(`Attempting to download resume: ${downloadUrl}`);
                      console.log(`Original resume URL: ${app.resumeUrl}`);
                      
                      try {
                        // First check if file exists
                        const checkResponse = await fetch(downloadUrl, { method: 'HEAD' });
                        if (checkResponse.ok) {
                          // File exists, proceed with download
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = `resume-${app.firstName}-${app.lastName}`;
                          link.click();
                        } else {
                          console.error(`Resume file not found: ${filename}`);
                          alert(`Resume file not found. This application has an invalid resume URL: ${app.resumeUrl}`);
                        }
                      } catch (error) {
                        console.error('Error downloading resume:', error);
                        alert(`Error downloading resume: ${error.message}`);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Resume
                  </Button>
                )}
                
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${app.applicantEmail}`}>
                    <Mail className="h-4 w-4 mr-1" />
                    Contact
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
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

  // Fetch recruiter's own jobs
  const { data: recruiterJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/recruiter/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/recruiter/jobs');
      return response.json();
    },
    enabled: user?.userType === 'recruiter'
  });

  // Calculate job statistics
  const jobsPosted = recruiterJobs.length;
  const jobsRemaining = Math.max(0, 10 - jobsPosted);
  const canCreateJob = jobsRemaining > 0;

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
      const response = await apiRequest('POST', '/api/recruiter/jobs', jobData);
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
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
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
      const response = await apiRequest('PUT', `/api/jobs/${editingJob.id}`, jobData);
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
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/jobs'] });
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

  const [viewingCandidates, setViewingCandidates] = useState<any[]>([]);
  const [isViewCandidatesOpen, setIsViewCandidatesOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");

  const viewCandidates = async (jobId: number, jobTitle: string) => {
    try {
      const response = await apiRequest('GET', `/api/recruiter/jobs/${jobId}/candidates`);
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

  if (!user || user.userType !== 'recruiter') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only accessible to recruiters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.firstName}!</p>
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{jobsPosted}</span> of <span className="font-medium">10</span> jobs posted
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(jobsPosted / 10) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {jobsRemaining} remaining
            </span>
          </div>
        </div>

        {/* Job Applications Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Job Applications & Resumes</CardTitle>
            <p className="text-sm text-gray-600">Access all job applications and resumes from job seekers</p>
          </CardHeader>
          <CardContent>
            <JobApplicationsSection />
          </CardContent>
        </Card>

        {/* Create Job Button */}
        <div className="mb-8">
          <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                disabled={!canCreateJob}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Job
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
                        {companies.length > 0 ? (
                          companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading companies...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {companies.length} companies loaded
                    </p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Type</label>
                    <Select value={newJob.jobType} onValueChange={(value) => setNewJob({ ...newJob, jobType: value, employmentType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience Level</label>
                    <Select value={newJob.experienceLevel} onValueChange={(value) => setNewJob({ ...newJob, experienceLevel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
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
        </div>

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
            ) : recruiterJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first job posting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recruiterJobs.map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.companyName}</p>
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

        {/* View Candidates Dialog */}
        <Dialog open={isViewCandidatesOpen} onOpenChange={setIsViewCandidatesOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Candidates for: {selectedJobTitle}</DialogTitle>
              <DialogDescription>
                Category-matched candidates available for this position. Click "Contact Candidate" to send an email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewingCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No candidates have been assigned to this job yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingCandidates.map((assignment: any, index: number) => (
                    <div key={`${assignment.candidate.id}-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-2xl text-blue-900 mb-2">
                            {assignment.candidate.firstName} {assignment.candidate.lastName || ""}
                          </h3>
                          <p className="text-xl text-gray-800 font-semibold">{assignment.candidate.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="default" size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                            <a href={`mailto:${assignment.candidate.email}`}>
                              <Mail className="h-4 w-4 mr-1" />
                              Contact Candidate
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
      </div>
    </div>
  );
}
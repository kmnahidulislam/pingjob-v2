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
import { Link } from "wouter";
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
  const { data: applications = [], isLoading, refetch, error } = useQuery({
    queryKey: ['/api/job-applications/for-recruiters'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/job-applications/for-recruiters');
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/auth?mode=login';
          throw new Error('Please log in to view applications');
        }
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: true
  });


  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <p className="font-medium">Failed to load applications</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to receive applications</h3>
        <p className="mt-1 text-sm text-gray-500">Applications will appear here when job seekers apply to your posted jobs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">All Job Applications ({applications.length})</h3>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary">{applications.length} Total Resumes</Badge>
        </div>
      </div>
      
      <div className="grid gap-4">
        {applications.map((app: any) => {
          return (
            <div key={app.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-lg">
                      {app.applicantName || (app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : 'Unknown User')}
                    </h4>
                    {app.matchScore > 0 && (
                      <Badge variant="secondary">Score: {app.matchScore}/12</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Job:</strong> {app.jobTitle || app.job?.title || 'Unknown Job'}</p>
                    <p><strong>Company:</strong> {app.companyName || app.job?.company?.name || 'Unknown Company'}</p>
                    <p><strong>Applied:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>
                    <p><strong>Email:</strong> {app.applicantEmail || app.applicant?.email || 'No email'}</p>
                    <p><strong>Category:</strong> {app.applicant?.category || 'No category'}</p>
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

                  {/* Individual Resume Section for Each Application */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {app.applicantName || 'Applicant'} Resume
                        </span>
                      </div>
                      {app.resumeUrl ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-blue-600 text-white hover:bg-blue-700"
                          onClick={async () => {
                            try {
                              const filename = app.resumeUrl.replace('/uploads/', '').replace('uploads/', '');
                              const downloadUrl = `/api/resume/${filename}`;
                              
                              const checkResponse = await fetch(downloadUrl, { method: 'HEAD' });
                              if (checkResponse.ok) {
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                const applicantName = app.applicantName || (app.applicant ? `${app.applicant.firstName || ''} ${app.applicant.lastName || ''}`.trim() : 'resume');
                                // The server will provide the correct filename
                                // link.download = `${applicantName.replace(/\s+/g, '-')}-resume.docx`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                toast({
                                  title: "Resume Not Found",
                                  description: "The resume file could not be located.",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Resume download error:", error);
                              toast({
                                title: "Download Failed",
                                description: "Unable to download resume. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download DOCX
                        </Button>
                      ) : (
                        <span className="text-gray-500 text-sm italic">No resume uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  {(app.applicantEmail || app.applicant?.email) && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${app.applicantEmail || app.applicant.email}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

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

        {/* Real Resume Applications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actual Resume Applications</CardTitle>
            <p className="text-sm text-gray-600">Job seekers who have uploaded resumes for your jobs</p>
          </CardHeader>
          <CardContent>
            <JobApplicationsSection />
          </CardContent>
        </Card>

        {/* Create Job Button */}
        <div className="mb-8">
          <Link href="/job-create">
            <Button 
              size="lg"
              disabled={!canCreateJob}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Job
            </Button>
          </Link>
          {!canCreateJob && (
            <p className="text-sm text-gray-500 mt-2">
              You have reached the maximum limit of 10 jobs. Delete some jobs to create new ones.
            </p>
          )}
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
                          {job.categoryId && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Category: {job.categoryId}
                            </Badge>
                          )}
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {job.candidateCount || 0} Emails Available
                          </Badge>
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
                          <Mail className="h-4 w-4 mr-1" />
                          Email {job.candidateCount || 0} Candidates
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
              <DialogTitle>Email Candidates for: {selectedJobTitle}</DialogTitle>
              <DialogDescription>
                Job seekers with matching category who you can email directly about this position.
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
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Building2, MapPin, Clock, Eye, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface JobApplication {
  id: number;
  jobId: number;
  applicantId: string;
  status: string;
  appliedAt: Date;
  job: {
    id: number;
    title: string;
    company: {
      name: string;
      logoUrl?: string;
    };
    location: string;
    employmentType: string;
    salary?: string;
  };
  coverLetter?: string;
  resumeUrl?: string;
}

export default function Applications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("applications");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user's job applications (limit to 10 most recent)
  const { data: applications = [], isLoading } = useQuery<JobApplication[]>({
    queryKey: ['/api/applications', { limit: 10 }],
    enabled: !!user
  });

  // Get application scores for each application
  const { data: applicationScores } = useQuery({
    queryKey: ['/api/applications/scores'],
    queryFn: async () => {
      if (!applications || !Array.isArray(applications) || applications.length === 0) return {};
      
      const scores: Record<number, any> = {};
      await Promise.allSettled(
        applications.map(async (app: JobApplication) => {
          try {
            const response = await fetch(`/api/applications/${app.id}/score`);
            if (response.ok) {
              scores[app.id] = await response.json();
            }
          } catch (error) {
            console.error(`Failed to fetch score for application ${app.id}:`, error);
          }
        })
      );
      return scores;
    },
    enabled: !!applications && Array.isArray(applications) && applications.length > 0,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/applications/${id}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Application updated",
        description: "Application status has been updated successfully."
      });
    }
  });

  const withdrawApplicationMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/applications/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Application withdrawn",
        description: "Your application has been withdrawn successfully."
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'interview':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = Array.isArray(applications) ? applications.filter((app: JobApplication) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = !searchQuery || 
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) : [];

  const applicationsByStatus = {
    applied: filteredApplications.filter((app: JobApplication) => app.status === 'pending' || app.status === 'applied'),
    under_review: filteredApplications.filter((app: JobApplication) => app.status === 'reviewed' || app.status === 'under_review'),
    interview: filteredApplications.filter((app: JobApplication) => app.status === 'interview'),
    accepted: filteredApplications.filter((app: JobApplication) => app.status === 'hired' || app.status === 'accepted'),
    rejected: filteredApplications.filter((app: JobApplication) => app.status === 'rejected')
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-gray-600">Track your job applications and their progress</p>
        </div>
        
        <div className="flex gap-3">
          <Input
            placeholder="Search jobs or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{applicationsByStatus.applied.length}</div>
            <div className="text-sm text-gray-600">Applied</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{applicationsByStatus.under_review.length}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{applicationsByStatus.interview.length}</div>
            <div className="text-sm text-gray-600">Interview</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{applicationsByStatus.accepted.length}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{applicationsByStatus.rejected.length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="scores">Resume Scores</TabsTrigger>
          <TabsTrigger value="applied">Applied ({applicationsByStatus.applied.length})</TabsTrigger>
          <TabsTrigger value="under_review">Review ({applicationsByStatus.under_review.length})</TabsTrigger>
          <TabsTrigger value="interview">Interview ({applicationsByStatus.interview.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({applicationsByStatus.accepted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({applicationsByStatus.rejected.length})</TabsTrigger>
        </TabsList>

        {/* Resume Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">No applications found</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application: JobApplication) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{application.job.title}</h3>
                        <p className="text-gray-600">{application.job.company.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      {applicationScores && applicationScores[application.id] ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 min-w-[200px]">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900 mb-2">
                              {applicationScores[application.id].matchScore}/12
                            </div>
                            <div className="text-xs font-medium text-blue-700 mb-3">Overall Match Score</div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="text-center">
                                <div className="font-bold text-blue-800">
                                  {applicationScores[application.id].skillsScore}/6
                                </div>
                                <div className="text-blue-600">Skills</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-blue-800">
                                  {applicationScores[application.id].experienceScore}/2
                                </div>
                                <div className="text-blue-600">Experience</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-blue-800">
                                  {applicationScores[application.id].educationScore}/2
                                </div>
                                <div className="text-blue-600">Education</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-800">
                                  +{applicationScores[application.id].companyScore || 0}
                                </div>
                                <div className="text-green-600">Company</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px] text-center">
                          <div className="text-gray-500">Score calculating...</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {Object.entries(applicationsByStatus).map(([status, apps]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {apps.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">No applications found for this status</div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {apps.map((application: JobApplication) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{application.job.title}</h3>
                              <p className="text-gray-600">{application.job.company.name}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {application.job.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Applied {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                                </div>
                                {application.job.salary && (
                                  <div className="flex items-center gap-1">
                                    <span>${application.job.salary}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                            {getStatusIcon(application.status)}
                            {application.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          
                          {/* Resume Score Display */}
                          {applicationScores && applicationScores[application.id] && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-w-[140px]">
                              <div className="text-xs font-medium text-blue-700 mb-1">Resume Match Score</div>
                              <div className="text-lg font-bold text-blue-900">
                                {applicationScores[application.id].matchScore}/12
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                Skills: {applicationScores[application.id].skillsScore}/6 • 
                                Experience: {applicationScores[application.id].experienceScore}/2 • 
                                Education: {applicationScores[application.id].educationScore}/2 • 
                                Company: +{applicationScores[application.id].companyScore || 0}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {application.resumeUrl && (
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                Resume
                              </Button>
                            )}
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Application Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold">Job Information</h4>
                                    <p><strong>Title:</strong> {application.job.title}</p>
                                    <p><strong>Company:</strong> {application.job.company.name}</p>
                                    <p><strong>Location:</strong> {application.job.location}</p>
                                    <p><strong>Type:</strong> {application.job.employmentType}</p>
                                  </div>
                                  
                                  {application.coverLetter && (
                                    <div>
                                      <h4 className="font-semibold">Cover Letter</h4>
                                      <p className="text-sm bg-gray-50 p-3 rounded">
                                        {application.coverLetter}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Resume Score Details */}
                                  {applicationScores && applicationScores[application.id] && (
                                    <div>
                                      <h4 className="font-semibold">Resume Match Analysis</h4>
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium">Overall Match Score:</span>
                                          <span className="text-xl font-bold text-blue-900">
                                            {applicationScores[application.id].matchScore}/10
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span>Skills Match:</span>
                                            <span className="font-medium">{applicationScores[application.id].skillsScore}/4</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Experience Match:</span>
                                            <span className="font-medium">{applicationScores[application.id].experienceScore}/3</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Education Match:</span>
                                            <span className="font-medium">{applicationScores[application.id].educationScore}/3</span>
                                          </div>
                                        </div>
                                        
                                        {applicationScores[application.id].parsedSkills && Array.isArray(applicationScores[application.id].parsedSkills) && (
                                          <div>
                                            <span className="text-sm font-medium">Matched Skills:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {applicationScores[application.id].parsedSkills.slice(0, 8).map((skill: string, index: number) => (
                                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                  {skill}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h4 className="font-semibold">Application Timeline</h4>
                                    <p>Applied on {format(new Date(application.appliedAt), 'MMMM dd, yyyy')}</p>
                                    <p>Current Status: <Badge className={getStatusColor(application.status)}>
                                      {application.status.replace('_', ' ').toUpperCase()}
                                    </Badge></p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {application.status === 'applied' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => withdrawApplicationMutation.mutate(application.id)}
                              >
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
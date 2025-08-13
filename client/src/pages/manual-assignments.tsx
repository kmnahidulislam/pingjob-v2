import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Briefcase } from "lucide-react";

export default function ManualAssignments() {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin-jobs'],
  });

  // Fetch job seekers
  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/users/job-seekers'],
  });

  // Fetch existing assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/manual-assignments'],
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { jobId: string; candidateId: string }) => {
      const response = await fetch('/api/manual-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create assignment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Created",
        description: "Candidate has been manually assigned to the job.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manual-assignments'] });
      setSelectedJob("");
      setSelectedCandidate("");
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  const handleCreateAssignment = () => {
    if (!selectedJob || !selectedCandidate) {
      toast({
        title: "Missing Selection",
        description: "Please select both a job and a candidate.",
        variant: "destructive",
      });
      return;
    }

    createAssignmentMutation.mutate({
      jobId: selectedJob,
      candidateId: selectedCandidate,
    });
  };

  if (jobsLoading || candidatesLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assignment data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Manual Job Assignments</h1>
      </div>

      {/* Create New Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Assign Candidate to Job</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job opening..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.company?.name || 'Company'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Candidate</label>
              <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a candidate..." />
                </SelectTrigger>
                <SelectContent>
                  {candidates?.map((candidate: any) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.firstName} {candidate.lastName} - {candidate.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCreateAssignment}
            disabled={createAssignmentMutation.isPending || !selectedJob || !selectedCandidate}
            className="w-full"
          >
            {createAssignmentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Assignment...
              </>
            ) : (
              "Create Assignment"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments?.length > 0 ? (
            <div className="space-y-3">
              {assignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {assignment.candidateName} → {assignment.jobTitle}
                    </div>
                    <div className="text-sm text-gray-600">
                      {assignment.companyName} • Assigned on {new Date(assignment.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={assignment.status === 'assigned' ? 'secondary' : 'default'}>
                    {assignment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No manual assignments created yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
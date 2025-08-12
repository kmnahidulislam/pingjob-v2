import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Upload, FileText, X } from "lucide-react";
import type { JobWithCompany } from "@/lib/types";

const applicationSchema = z.object({
  jobId: z.number(),
  coverLetter: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface JobApplicationModalProps {
  job: JobWithCompany;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobApplicationModal({ 
  job, 
  isOpen, 
  onClose 
}: JobApplicationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      jobId: job.id
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (data: ApplicationFormData & { resume?: File }) => {
      console.log('=== CLIENT FILE UPLOAD DEBUG ===');
      console.log('Resume file:', data.resume ? {
        name: data.resume.name,
        size: data.resume.size,
        type: data.resume.type
      } : 'No resume file');
      
      if (!data.resume) {
        throw new Error('Please select a resume file before submitting your application.');
      }
      
      const formData = new FormData();
      formData.append('jobId', data.jobId.toString());
      if (data.coverLetter) {
        formData.append('coverLetter', data.coverLetter);
      }
      formData.append('resume', data.resume);
      
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }

      console.log('Making POST request to /api/applications...');
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const error = await response.text();
        console.error('Upload failed with error:', error);
        throw new Error(error || 'Failed to submit application');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const autoCount = data.autoApplicationsCount || 0;
      toast({
        title: "Application submitted successfully",
        description: autoCount > 0 
          ? `Applied to ${autoCount + 1} jobs total (1 direct + ${autoCount} auto-matched by category)`
          : `Your application for ${job.title} has been sent to the hiring team`
      });
      // Invalidate multiple caches to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${job.id}`] });
      
      // Clear entire cache and force refetch of ALL job-related queries
      queryClient.removeQueries({ queryKey: ['/api/admin-jobs'] });
      queryClient.removeQueries({ queryKey: ['/api/jobs'] });
      
      // Force immediate refetch of admin jobs for home page with multiple attempts
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/admin-jobs'] });
      }, 100);
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/admin-jobs'] });
      }, 1000);
      
      // Emit custom event to force home page refresh
      if (import.meta.env.DEV) console.log('Emitting jobApplicationSubmitted event to force home page refresh');
      window.dispatchEvent(new CustomEvent('jobApplicationSubmitted', { detail: { autoApplicationsCount: autoCount } }));
      
      reset();
      setSelectedFile(null);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting application",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ApplicationFormData) => {
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form data:', data);
    console.log('Selected file:', selectedFile ? {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    } : 'No file selected');
    
    if (!selectedFile) {
      toast({
        title: "Resume required",
        description: "Please upload a resume before submitting your application",
        variant: "destructive"
      });
      return;
    }
    
    applyMutation.mutate({
      ...data,
      resume: selectedFile
    });
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            {job.company?.name && `at ${job.company.name}`} • {job.location}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Applicant Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Applying as:</h4>
            <p className="text-sm">
              {user?.firstName} {user?.lastName} ({user?.email})
            </p>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>Resume/CV</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-linkedin-blue bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between bg-white border rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-linkedin-blue" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PDF, DOC, DOCX (max 5MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="resume-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => document.getElementById('resume-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Write a brief message to the hiring manager about why you're interested in this role..."
              rows={6}
              {...register('coverLetter')}
            />
            {errors.coverLetter && (
              <p className="text-sm text-error-red">{errors.coverLetter.message}</p>
            )}
          </div>

          {/* Job Requirements Preview */}
          {job.requirements && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Job Requirements:</h4>
              <p className="text-sm text-gray-600 line-clamp-4">
                {job.requirements}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={applyMutation.isPending}
              className="bg-linkedin-blue hover:bg-linkedin-dark"
            >
              {applyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

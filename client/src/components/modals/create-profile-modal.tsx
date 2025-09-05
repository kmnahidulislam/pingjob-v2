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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  headline: z.string().min(1, "Headline is required").max(120, "Headline too long"),
  summary: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  userType: z.enum(['job_seeker', 'recruiter', 'client', 'admin'])
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CreateProfileModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: CreateProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userType: 'job_seeker'
    }
  });

  const userType = watch('userType');

  const createProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest('PUT', '/api/profile', data),
    onSuccess: () => {
      toast({
        title: "Profile updated successfully",
        description: "Your professional profile has been updated"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.removeQueries({ queryKey: ['/api/profile'], exact: false });
      queryClient.refetchQueries({ queryKey: ['/api/profile'], exact: false });
      onComplete();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating profile",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    createProfileMutation.mutate(data);
  };

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Marketing",
    "Consulting",
    "Real Estate",
    "Media",
    "Non-profit",
    "Government",
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Let's set up your professional profile to get the most out of PingJob.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="userType">I am a...</Label>
            <Select 
              value={userType} 
              onValueChange={(value) => setValue('userType', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job_seeker">Job Seeker</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="client">Client/Employer</SelectItem>
                <SelectItem value="admin">Platform Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.userType && (
              <p className="text-sm text-error-red">{errors.userType.message}</p>
            )}
          </div>

          {/* Professional Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline</Label>
            <Input
              id="headline"
              placeholder={
                userType === 'job_seeker' ? "e.g., Software Engineer at TechCorp" :
                userType === 'recruiter' ? "e.g., Senior Technical Recruiter" :
                userType === 'client' ? "e.g., CEO at InnovateTech" :
                "e.g., Platform Administrator"
              }
              {...register('headline')}
            />
            {errors.headline && (
              <p className="text-sm text-error-red">{errors.headline.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA"
              {...register('location')}
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select onValueChange={(value) => setValue('industry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">About You (Optional)</Label>
            <Textarea
              id="summary"
              placeholder={
                userType === 'job_seeker' 
                  ? "Tell us about your professional background, skills, and career goals..."
                  : userType === 'recruiter'
                  ? "Describe your recruiting experience and the types of roles you specialize in..."
                  : userType === 'client'
                  ? "Tell us about your company, its mission, and what makes it a great place to work..."
                  : "Describe your role and responsibilities..."
              }
              rows={4}
              {...register('summary')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Skip for Now
            </Button>
            <Button 
              type="submit" 
              disabled={createProfileMutation.isPending}
              className="bg-linkedin-blue hover:bg-linkedin-dark"
            >
              {createProfileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

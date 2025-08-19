import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JobWithCompany } from "@/lib/types";

interface JobEditModalProps {
  job: JobWithCompany | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobEditModal({ job, isOpen, onClose }: JobEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch company information
  const { data: company } = useQuery<any>({
    queryKey: [`/api/companies/${job?.companyId}`],
    enabled: !!job?.companyId,
  });

  // Location dropdown states
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Location data queries
  const { data: countries } = useQuery({
    queryKey: ['/api/countries'],
    queryFn: async () => {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error('Failed to fetch countries');
      return response.json();
    }
  });

  const { data: states } = useQuery({
    queryKey: ['/api/states', selectedCountryId],
    queryFn: async () => {
      if (!selectedCountryId) return [];
      const response = await fetch(`/api/states/${selectedCountryId}`);
      if (!response.ok) throw new Error('Failed to fetch states');
      return response.json();
    },
    enabled: !!selectedCountryId
  });

  const { data: cities } = useQuery({
    queryKey: ['/api/cities', selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const response = await fetch(`/api/cities/${selectedStateId}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: !!selectedStateId
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    employmentType: "full_time",
    experienceLevel: "entry",
    salary: "",
    skills: "",
    categoryId: "",
  });

  // Update form when job changes
  useEffect(() => {
    if (job) {
      if (import.meta.env.DEV) console.log('Job data in modal:', job);
      setFormData({
        title: job.title || "",
        description: job.description || "",
        location: job.location || "",
        city: job.city || "",
        state: job.state || "",
        zipCode: job.zipCode || "",
        country: job.country || "",
        employmentType: job.employmentType || "full_time",
        experienceLevel: job.experienceLevel || "entry",
        salary: job.salary || "",
        skills: Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || ""),
        categoryId: job.categoryId?.toString() || "1",
      });
    }
  }, [job]);

  // Update location dropdown states when form data changes
  useEffect(() => {
    if (formData.country && countries && countries.length > 0) {
      console.log('Looking for country:', formData.country, 'in countries:', countries);
      const countryObj = countries.find((c: any) => c.name === formData.country);
      if (countryObj) {
        console.log('Found country object:', countryObj);
        setSelectedCountryId(countryObj.id);
      }
    }
  }, [formData.country, countries]);

  useEffect(() => {
    if (formData.state && states && states.length > 0) {
      console.log('Looking for state:', formData.state, 'in states:', states);
      const stateObj = states.find((s: any) => s.name === formData.state);
      if (stateObj) {
        console.log('Found state object:', stateObj);
        setSelectedStateId(stateObj.id);
      }
    }
  }, [formData.state, states]);

  const updateJobMutation = useMutation({
    mutationFn: (jobData: typeof formData) => {
      const processedJobData = {
        ...jobData,
        categoryId: parseInt(jobData.categoryId),
        skills: jobData.skills ? jobData.skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0) : []
      };
      if (import.meta.env.DEV) console.log('Sending job update data:', processedJobData);
      return apiRequest('PUT', `/api/jobs/${job?.id}`, processedJobData);
    },
    onSuccess: () => {
      toast({
        title: "Job updated successfully",
        description: "The job posting has been updated"
      });
      onClose();
      
      // Complete cache clear and refresh strategy
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter-jobs'] });
      
      // Remove all admin-jobs cache entries completely
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/admin-jobs';
        }
      });
      
      // Force immediate refetch with all variations
      queryClient.refetchQueries({ 
        queryKey: ['/api/admin-jobs'],
        exact: false
      });
      
      // Additional forced refresh for home page
      queryClient.refetchQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/admin-jobs';
        }
      });
      
      // Emit custom event to force home page refresh
      if (import.meta.env.DEV) console.log('Emitting jobUpdated event to force home page refresh');
      window.dispatchEvent(new CustomEvent('jobUpdated'));
    },
    onError: (error: any) => {
      toast({
        title: "Error updating job",
        description: error.message || "Failed to update job posting",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateJobMutation.mutate(formData);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Posting</DialogTitle>
          <div className="text-sm text-gray-600 mt-1">
            Company: {(company as any)?.name || (job?.company as any)?.name || 'Loading company...'}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Title */}
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="Enter job title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="categoryId">Job Category *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select job category" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(categories) && categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type and Experience Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select value={formData.employmentType} onValueChange={(value) => handleInputChange('employmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
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
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
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

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => {
                  const countryObj = countries?.find((c: any) => c.name === value);
                  if (countryObj) {
                    setSelectedCountryId(countryObj.id);
                    setSelectedStateId(null);
                    handleInputChange('country', value);
                    handleInputChange('state', '');
                    handleInputChange('city', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country: any) => (
                    <SelectItem key={country.id} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => {
                  const stateObj = states?.find((s: any) => s.name === value);
                  if (stateObj) {
                    setSelectedStateId(stateObj.id);
                    handleInputChange('state', value);
                    handleInputChange('city', '');
                  }
                }}
                disabled={!selectedCountryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCountryId ? "Select state" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {states?.map((state: any) => (
                    <SelectItem key={state.id} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => handleInputChange('city', value)}
                disabled={!selectedStateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedStateId ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city: any) => (
                    <SelectItem key={`${city.id}-${city.name}`} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                placeholder="Enter zip code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
              />
            </div>
          </div>

          {/* Salary and Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                placeholder="e.g., $50,000 - $70,000"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                placeholder="e.g., React, Node.js, TypeScript"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter detailed job description"
              className="min-h-[120px]"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateJobMutation.isPending}
              className="bg-linkedin-blue hover:bg-linkedin-dark"
            >
              {updateJobMutation.isPending ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
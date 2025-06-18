import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import JobApplicationModal from "@/components/modals/job-application-modal";
import JobEditModal from "@/components/modals/job-edit-modal";
import {
  Building,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  ArrowLeft,
  Bookmark,
  Share2,
  Edit,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { Link } from "wouter";
import type { JobWithCompany } from "@/lib/types";

// Service name mapping
const serviceNameMap: { [key: string]: string } = {
  'ste': 'Strategic Consulting',
  'staff': 'Staff Augmentation', 
  'staffing': 'Staffing Services',
  'consulting': 'Consulting Services',
  'development': 'Development Services',
  'tech': 'Technology Services'
};

function getServiceNames(services: string): string {
  if (!services) return 'General Services';
  return services.split(',')
    .map(s => s.trim().toLowerCase())
    .map(s => serviceNameMap[s] || s.charAt(0).toUpperCase() + s.slice(1))
    .join(', ');
}

// Vendor Info Card Component
function VendorInfoCard({ companyId }: { companyId: number }) {
  const { user } = useAuth();
  
  const { data: vendorData, isLoading } = useQuery({
    queryKey: [`/api/companies/${companyId}/vendors`],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/vendors`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Partner Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendorData || vendorData.length === 0) {
    return null; // Don't show card if no vendors
  }

  // Filter only approved vendors
  const approvedVendors = vendorData.filter((vendor: any) => vendor.status === 'approved');
  
  if (approvedVendors.length === 0) {
    return null; // Don't show card if no approved vendors
  }

  // For unregistered users, show maximum 3 vendors
  const isAuthenticated = false; // TODO: Get from auth context
  const vendorsToShow = isAuthenticated ? approvedVendors : approvedVendors.slice(0, 3);
  const totalCount = approvedVendors.length;
  const showingCount = vendorsToShow.length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Partner Vendors
          <Badge variant="secondary" className="ml-2">
            {totalCount} total
          </Badge>
        </CardTitle>
        {!isAuthenticated && totalCount > 3 && (
          <p className="text-sm text-gray-600">
            Showing {showingCount} of {totalCount} vendors. 
            <Link href="/auth" className="text-blue-600 hover:underline ml-1">
              Sign in to view all
            </Link>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendorsToShow.map((vendor: any) => (
            <div key={vendor.vendor_id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{vendor.vendor_name}</h4>
                  <p className="text-blue-600 text-sm font-medium mb-2">
                    {getServiceNames(vendor.services)}
                  </p>
                  
                  {/* Location */}
                  <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[vendor.city, vendor.state, vendor.zip_code, vendor.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {vendor.email && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Approved
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: job, isLoading, error } = useQuery<JobWithCompany>({
    queryKey: ['/api/jobs', id],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
    enabled: !!id
  });

  const handleApply = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for jobs",
        variant: "destructive"
      });
      return;
    }
    
    if (user.userType !== 'job_seeker') {
      toast({
        title: "Access restricted",
        description: "Only job seekers can apply for jobs",
        variant: "destructive"
      });
      return;
    }

    setIsApplicationModalOpen(true);
  };

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to bookmark jobs",
        variant: "destructive"
      });
      return;
    }
    
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Bookmarked",
      description: isBookmarked 
        ? "Job removed from your bookmarks" 
        : "Job added to your bookmarks"
    });
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/jobs">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
              <p className="text-gray-600 mb-4">
                The job you're looking for could not be found.
              </p>
              <Link href="/jobs">
                <Button>Browse All Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const skillsArray: string[] = job.skills ? 
    (Array.isArray(job.skills) ? job.skills : []) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/jobs">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        {/* Main Job Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-16 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  {job.company?.logoUrl && job.company.logoUrl !== "NULL" ? (
                    <img 
                      src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                      alt={job.company.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        console.log('Image failed to load:', job.company?.logoUrl);
                        console.log('Trying absolute path:', `/${job.company?.logoUrl?.replace(/ /g, '%20')}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white">
                      <Building className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {job.title}
                  </h1>
                  <p className="text-lg text-gray-700 font-medium mb-2">
                    {job.company?.name || 'Unknown Company'}
                  </p>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {[job.city, job.state, job.zipCode, job.country]
                        .filter(Boolean)
                        .join(', ') || job.location}
                    </span>
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Posted {job.createdAt ? formatTimeAgo(job.createdAt) : 'Recently'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {/* Admin Edit Button */}
                {(user?.email === 'krupas@vedsoft.com' || user?.userType === 'admin') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Job
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className="text-gray-500 hover:text-linkedin-blue"
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Job Info Tags */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant="outline" className="text-sm py-1 px-3">
                {job.jobType?.replace('_', ' ') || 'Full Time'}
              </Badge>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {job.experienceLevel.replace('_', ' ')} level
              </div>
              {job.salary && (
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salary}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {job.applicationCount || 0} applicants
              </div>
            </div>

            {/* Apply Button - Prominent for Job Seekers */}
            {user?.userType === 'job_seeker' && (
              <div className="mb-6">
                <Button
                  onClick={handleApply}
                  className="bg-linkedin-blue text-white hover:bg-linkedin-dark text-lg px-8 py-3"
                  size="lg"
                >
                  Apply Now
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Quick apply with your profile
                </p>
              </div>
            )}

            <Separator className="mb-6" />

            {/* Job Description */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">About this job</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {skillsArray.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.map((skill: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-sm py-1 px-3"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendors Card */}
        {job.company && (
          <VendorInfoCard companyId={job.company.id} />
        )}

        {/* Company Info Card */}
        {job.company && (
          <Card>
            <CardHeader>
              <CardTitle>About {job.company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-10 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  {job.company.logoUrl && job.company.logoUrl !== "NULL" ? (
                    <img 
                      src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                      alt={job.company.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white">
                      <Building className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-4">
                    {job.company.description || 'No company description available.'}
                  </p>
                  <Link href={`/companies`}>
                    <Button variant="outline" size="sm">
                      View Company Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Application Modal */}
      {job && (
        <JobApplicationModal
          job={job}
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
        />
      )}

      {/* Edit Modal */}
      {job && (
        <JobEditModal
          job={job}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
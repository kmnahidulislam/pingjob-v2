import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Briefcase, Users, Globe, Calendar, Heart, ArrowLeft, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
// Format job location helper function
const formatJobLocation = (job: any) => {
  const parts = [];
  if (job.city) parts.push(job.city);
  if (job.state) parts.push(job.state);
  if (job.zipCode) parts.push(job.zipCode);
  return parts.length > 0 ? parts.join(', ') : job.location || 'Location not specified';
};

export default function CompanyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleApplyNow = (jobId: number) => {
    console.log('Company page Apply Now clicked, user:', user, 'jobId:', jobId);
    if (!user) {
      // Store the job application intent and redirect to login
      const redirectPath = `/jobs/${jobId}`;
      localStorage.setItem('postAuthRedirect', redirectPath);
      console.log('Company page stored postAuthRedirect:', redirectPath);
      console.log('Company page current localStorage postAuthRedirect:', localStorage.getItem('postAuthRedirect'));
      navigate('/auth');
      return;
    }
    
    // Navigate to job details page where they can apply
    navigate(`/jobs/${jobId}`);
  };
  
  const { data: companyDetails, isLoading } = useQuery({
    queryKey: [`/api/companies/${id}/details`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/companies/${id}/details`);
      const data = await response.json();
      console.log('🚀 Fresh API Response:', data);
      console.log('🚀 totalJobCount in response:', data.totalJobCount);
      return data;
    },
    enabled: !!id,
    staleTime: 0 // Force fresh fetch
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!companyDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <p className="text-gray-600 mb-6">The company you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const company = companyDetails || {};
  const openJobs = companyDetails?.openJobs || [];
  const vendors = companyDetails?.vendors || [];
  // Ensure totalJobCount is properly handled - use explicit check instead of || operator  
  const totalJobCount = companyDetails?.totalJobCount !== undefined && companyDetails?.totalJobCount !== null 
    ? Number(companyDetails.totalJobCount) 
    : openJobs.length;
  
  // Debug logging - let's see what we're getting
  console.log('🔍 Frontend Debug:', {
    'API totalJobCount': companyDetails?.totalJobCount,
    'openJobs length': openJobs.length,
    'final totalJobCount': totalJobCount,
    'typeof API totalJobCount': typeof companyDetails?.totalJobCount,
    'raw companyDetails keys': Object.keys(companyDetails || {})
  });
  
  
  const getDisplayAddress = (company: any) => {
    const parts = [];
    if (company.city) parts.push(company.city);
    if (company.state) parts.push(company.state);
    if (company.zipCode) parts.push(company.zipCode);
    if (company.country && company.country !== 'United States') parts.push(company.country);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Company Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              {/* Company Logo */}
              <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                {company.logoUrl && company.logoUrl !== "NULL" ? (
                  <img 
                    src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                    alt={company.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl"
                  style={{display: company.logoUrl && company.logoUrl !== "NULL" ? 'none' : 'flex'}}
                >
                  {(company.name || 'C').charAt(0).toUpperCase()}
                </div>
              </div>
              
              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                
                {company.industry && (
                  <p className="text-lg text-gray-600 mb-3">{company.industry}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{getDisplayAddress(company)}</span>
                  </div>
                  
                  {company.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Company Stats */}
                <div className="flex items-center space-x-4">
                  {openJobs.length > 0 && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {openJobs.length} Open Job{openJobs.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  
                  {vendors.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="h-4 w-4 mr-1" />
                      {vendors.length} Vendor{vendors.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Company Description */}
            {company.description && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{company.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">Open Jobs ({totalJobCount})</TabsTrigger>
            {vendors.length > 0 && (
              <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
            )}
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {openJobs.length > 0 ? (
              <div className="grid gap-4">
                {openJobs.map((job: any) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            <Link href={`/jobs/${job.id}`} className="hover:text-blue-600 transition-colors">
                              {job.title}
                            </Link>
                          </h3>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            {job.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{job.location}</span>
                              </div>
                            )}
                            
                            {job.employmentType && (
                              <Badge variant="outline" className="text-xs">
                                {job.employmentType.replace('_', ' ').toUpperCase()}
                              </Badge>
                            )}
                            
                            {job.salary && (
                              <span className="font-medium text-green-600">{job.salary}</span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 line-clamp-2 mb-4">
                            {job.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/jobs/${job.id}`}>View Details</Link>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleApplyNow(job.id);
                                }}
                              >
                                Apply Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Open Positions</h3>
                  <p className="text-gray-600">This company doesn't have any open positions at the moment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vendors Tab */}
          {vendors.length > 0 && (
            <TabsContent value="vendors" className="space-y-4">
              <div className="grid gap-4">
                {vendors.map((vendor: any) => (
                  <Card key={vendor.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{vendor.name}</h4>
                          <p className="text-sm text-gray-600">{vendor.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
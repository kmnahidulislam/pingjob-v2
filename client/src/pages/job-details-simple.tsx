import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { useAuth } from "@/hooks/use-auth";

export default function JobDetailsSimple() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Handle apply button click
  const handleApply = () => {
    console.log('Apply Now clicked, user:', user);
    
    if (!user) {
      console.log('Redirecting to auth with job redirect...');
      localStorage.setItem('postAuthRedirect', `/jobs/${id}`);
      console.log('Stored postAuthRedirect:', `/jobs/${id}`);
      console.log('Current localStorage postAuthRedirect:', localStorage.getItem('postAuthRedirect'));
      navigate('/auth');
      return;
    }

    // User is authenticated, redirect to application form
    navigate(`/applications?job=${id}`);
  };

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['/api/jobs', id],
    queryFn: async () => {
      console.log('Fetching job details for ID:', id);
      const response = await fetch(`/api/jobs/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.status}`);
      }
      const data = await response.json();
      console.log('Job data received:', data);
      return data;
    },
    enabled: !!id,
    retry: false
  });

  // Fetch vendors for this job
  const { data: vendorData } = useQuery({
    queryKey: ['/api/jobs', id, 'vendors'],
    queryFn: async () => {
      console.log('Fetching vendors for job ID:', id);
      const response = await fetch(`/api/jobs/${id}/vendors`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch vendors:', response.status);
        return { vendors: [], isLimited: false, totalCount: 0 };
      }
      const data = await response.json();
      console.log('Vendors data received:', data);
      // Handle both old format (array) and new format (object)
      if (Array.isArray(data)) {
        return { vendors: data, isLimited: false, totalCount: data.length };
      }
      return data || { vendors: [], isLimited: false, totalCount: 0 };
    },
    enabled: !!id,
    retry: false
  });

  const vendors = vendorData?.vendors || [];
  const isLimited = vendorData?.isLimited || false;
  const totalVendorCount = vendorData?.totalCount || 0;
  const signupMessage = vendorData?.message;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
            </Link>
          </div>
        </header>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Job details error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
            </Link>
          </div>
        </header>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-4">
                  Error: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <p className="text-gray-600 mb-4">Job ID: {id}</p>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
            </Link>
          </div>
        </header>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
                <p className="text-gray-600 mb-4">Job ID: {id}</p>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
          </Link>
          
          {/* Apply Now Button in Header */}
          <Button
            onClick={handleApply}
            className="bg-linkedin-blue hover:bg-linkedin-blue-dark text-white"
            size="sm"
          >
            Apply Now
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            
            {/* Large Apply Now Button */}
            <Button
              onClick={handleApply}
              className="bg-linkedin-blue text-white hover:bg-linkedin-dark text-lg px-8 py-3"
              size="lg"
            >
              Apply Now
            </Button>
          </div>

          <Card className="mb-6">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {job.title || 'No Title'}
            </h1>
            <p className="text-lg text-gray-700 font-medium mb-2">
              {job.company?.name || 'Unknown Company'}
            </p>
            <p className="text-gray-600 mb-4">
              {job.location || 'Location not specified'}
            </p>
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: job.description || 'No description available' 
                }} 
                className="mb-6"
              />
              
              {job.requirements && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: job.requirements 
                    }} 
                    className="mb-6"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {vendors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recommended Staffing Partners
              </CardTitle>
              {isLimited && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700 mb-2">
                    <span className="font-medium">{signupMessage}</span>
                  </p>
                  <Link href="/auth">
                    <Button size="sm" className="bg-linkedin-blue hover:bg-blue-700">
                      Sign Up to View All {totalVendorCount} Vendors
                    </Button>
                  </Link>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {vendors.map((vendor: any) => (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 text-lg">{vendor.name}</h4>
                      
                      {(vendor.address || vendor.city) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            {vendor.address && vendor.address !== 'NULL' && `${vendor.address}, `}
                            {vendor.city && vendor.city !== 'NULL' && vendor.state && vendor.state !== 'NULL' && `${vendor.city}, ${vendor.state}`}
                            {vendor.zipCode && vendor.zipCode !== 'NULL' && `, ${vendor.zipCode}`}
                            {vendor.city && vendor.city !== 'NULL' && `, United States`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
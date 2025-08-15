import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Globe, Users } from "lucide-react";
import { Link } from "wouter";

export default function JobDetailsSimple() {
  const { id } = useParams();

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
        console.log('Vendors fetch failed:', response.status);
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
      <div className="min-h-screen bg-gray-50 p-6">
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
    );
  }

  if (error) {
    console.error('Job details error:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
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
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

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
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="text-gray-700 whitespace-pre-line">
                {job.description || 'No description available'}
              </div>
            </div>

            {job.requirements && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.benefits && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {job.benefits}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendors Section */}
        {vendors && vendors.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recruiting Partners ({isLimited ? `${vendors.length} of ${totalVendorCount}` : vendors.length})
              </CardTitle>
              {isLimited && signupMessage && (
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
              <div className="grid gap-6 md:grid-cols-2">
                {vendors.map((vendor: any) => (
                  <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {vendor.logoUrl && vendor.logoUrl !== "NULL" ? (
                          <img 
                            src={`/${vendor.logoUrl.replace(/ /g, '%20')}`} 
                            alt={vendor.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Users className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{vendor.name}</h4>
                        {vendor.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {vendor.description}
                          </p>
                        )}
                        {vendor.location && (
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vendor.location}
                          </div>
                        )}
                        {vendor.website && vendor.website !== "NULL" && (
                          <div className="flex items-center text-sm">
                            <Globe className="h-3 w-3 mr-1" />
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
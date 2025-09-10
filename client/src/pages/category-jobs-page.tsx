import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, Calendar, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: number;
  title: string;
  description: string;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employmentType: string;
  experienceLevel: string;
  createdAt: Date | null;
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface TopCompany {
  id: number;
  name: string;
  logoUrl: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  website: string | null;
  jobCount: number;
  vendorCount: number;
}

export default function CategoryJobsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const categoryIdNum = parseInt(categoryId || "0");

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: [`/api/categories/${categoryIdNum}/jobs`],
    enabled: !!categoryIdNum,
  });

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryIdNum}`],
    enabled: !!categoryIdNum,
  });

  const { data: topCompanies, isLoading: companiesLoading } = useQuery<TopCompany[]>({
    queryKey: [`/api/categories/${categoryIdNum}/companies`],
    enabled: !!categoryIdNum,
  });



  if (jobsLoading || categoryLoading || companiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobs || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatLocation = (job: Job) => {
    const parts = [
      job.city,
      job.state
      // Removed job.country to exclude "United States"
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(", ");
    }
    
    // Fallback to job.location but clean it
    if (job.location) {
      return job.location
        .replace(/, United States$/, '')
        .replace(/ United States$/, '')
        .replace(/United States,?\s*/, '')
        .trim() || "Remote";
    }
    
    return "Remote";
  };

  const formatCompanyLocation = (company: Job['company']) => {
    if (!company) return "Unknown Company";
    const parts = [
      company.city,
      company.state
      // Removed company.country to exclude "United States"
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(", ");
    }
    
    // Fallback to company.location but clean it
    if (company.location) {
      return company.location
        .replace(/, United States$/, '')
        .replace(/ United States$/, '')
        .replace(/United States,?\s*/, '')
        .trim();
    }
    
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2">{category.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary">
              <Users className="mr-1 h-4 w-4" />
              {jobs.length} Available Jobs
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List - Left Column */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Jobs</h2>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No jobs available in this category</h3>
                  <p className="text-sm">Check back later for new opportunities</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{(job as any).companyName || job.company?.name || "Unknown Company"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{formatLocation(job)}</span>
                            </div>
                            {job.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.company?.logoUrl && (
                            <img
                              src={`/logos/${job.company.logoUrl.replace(/ /g, '%20')}`}
                              alt={`${job.company.name} logo`}
                              className="h-12 w-16 object-contain rounded"
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{job.employmentType.replace('_', ' ')}</Badge>
                        <Badge variant="outline">{job.experienceLevel}</Badge>
                      </div>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {job.company && formatCompanyLocation(job.company)}
                        </div>
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Top Clients Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top Companies in {category.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Companies ranked by job count with real vendor data</p>
              {topCompanies && topCompanies.length > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Live Database Rankings:</p>
                  <p className="text-xs text-yellow-700">
                    Top company: {topCompanies[0]?.name} ({topCompanies[0]?.jobCount} jobs, {topCompanies[0]?.vendorCount} vendors)
                  </p>
                </div>
              ) : null}
              {topCompanies && topCompanies.length > 0 ? (
                <div className="space-y-4">
                  {topCompanies.slice(0, 8).map((company, index) => (
                    <div key={company.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 relative">
                        <div className="absolute -top-1 -left-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        {company.logoUrl && company.logoUrl !== "logos/NULL" ? (
                          <img
                            src={`/logos/${company.logoUrl.replace(/ /g, '%20')}`}
                            alt={`${company.name} logo`}
                            className="h-12 w-16 object-contain rounded border"
                          />
                        ) : (
                          <div className="h-12 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded border flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {company.name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          {(company.jobCount || 0) > 0 && (
                            <Badge variant="default" className="text-sm bg-green-700 text-white font-extrabold px-3 py-1 shadow-md">
                              {company.jobCount} JOBS
                            </Badge>
                          )}
                          {(company.vendorCount || 0) > 0 && (
                            <Badge variant="default" className="text-sm bg-blue-700 text-white font-extrabold px-3 py-1 shadow-md">
                              {company.vendorCount} VENDORS
                            </Badge>
                          )}
                        </div>
                        {(company.city || company.state) && (
                          <p className="text-xs text-gray-600 font-medium">
                            📍 {[company.city, company.state, company.zipCode].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No companies found for this category</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">Data from live database • Updated in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
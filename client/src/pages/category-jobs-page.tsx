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

  if (jobsLoading || categoryLoading) {
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
      job.state,
      job.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : job.location || "Remote";
  };

  const formatCompanyLocation = (company: Job['company']) => {
    if (!company) return "Unknown Company";
    const parts = [
      company.city,
      company.state,
      company.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : company.location || "";
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

      {/* Jobs List */}
      <div className="container mx-auto px-4 py-8">
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
                          <span>{job.company?.name || "Unknown Company"}</span>
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
    </div>
  );
}
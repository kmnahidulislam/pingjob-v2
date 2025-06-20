import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface CategoryWithJobCount {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date | null;
  jobCount: number;
}

interface JobCategoriesProps {
  showAll?: boolean;
  limit?: number;
}

export function JobCategories({ showAll = false, limit = 8 }: JobCategoriesProps) {
  const { data: categories, isLoading, error } = useQuery<CategoryWithJobCount[]>({
    queryKey: ['/api/categories/with-counts'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !categories) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load job categories</p>
      </div>
    );
  }

  const displayCategories = showAll ? categories : categories.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayCategories.map((category) => (
          <Link key={category.id} href={`/categories/${category.id}/jobs`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="truncate">{category.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {category.jobCount} jobs
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {!showAll && categories.length > limit && (
        <div className="text-center">
          <Link href="/categories">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Categories ({categories.length} total)
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
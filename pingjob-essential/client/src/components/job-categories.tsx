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
    <div className="space-y-3">
      {displayCategories.map((category) => (
        <div key={category.id} className="flex items-center justify-between">
          <Link href={`/categories/${category.id}/jobs`}>
            <span className="text-sm font-medium text-blue-600 hover:underline">
              {category.name}
            </span>
          </Link>
          <Badge variant="secondary" className="text-xs">
            {category.jobCount} jobs
          </Badge>
        </div>
      ))}
      
      {!showAll && categories.length > limit && (
        <div className="pt-3 border-t">
          <Link href="/categories">
            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
              View All Categories
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
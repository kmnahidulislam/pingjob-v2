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
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  isMobile?: boolean;
}

export function JobCategories({ 
  showAll = false, 
  limit = 8, 
  selectedCategory, 
  onCategorySelect,
  isMobile = false 
}: JobCategoriesProps) {
  const { data: categories, isLoading, error } = useQuery<CategoryWithJobCount[]>({
    queryKey: ['/api/categories/with-counts'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className={isMobile ? "space-y-2" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={isMobile ? "h-8 bg-gray-200 rounded animate-pulse" : ""}>
            {!isMobile && (
              <Card className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            )}
          </div>
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

  if (isMobile) {
    return (
      <div className="space-y-2">
        {displayCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id.toString())}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              selectedCategory === category.id.toString()
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm font-medium">{category.name}</span>
            <Badge variant="secondary" className="text-xs">
              {category.jobCount}
            </Badge>
          </button>
        ))}
        
        {!showAll && categories.length > limit && (
          <div className="pt-2">
            <Link href="/categories">
              <button className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium py-2">
                View All Categories
              </button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect?.(category.id.toString())}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            selectedCategory === category.id.toString()
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">{category.name}</span>
          <Badge variant="secondary" className="text-xs">
            {category.jobCount} jobs
          </Badge>
        </button>
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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  Briefcase,
  Calendar,
  DollarSign,
  Heart,
  Globe,
  Plus,
  LogOut,
  TrendingUp,
  Clock,
  Filter,
  CheckCircle,
  Rocket,
  Target,
  Bot,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

export default function PingJobHome() {
  const { user, logoutMutation } = useAuth();

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ["/api/platform/stats"],
  });

  // Fetch admin jobs for homepage
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/admin-jobs"],
  });

  // Fetch top companies
  const { data: topCompanies } = useQuery({
    queryKey: ["/api/companies/top"],
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories/with-counts"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">PingJob</span>
                </div>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/jobs" className="text-gray-600 hover:text-gray-900">Jobs</Link>
              <Link href="/companies" className="text-gray-600 hover:text-gray-900">Companies</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Welcome, {user.firstName || user.email}</span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth">
                    <Button variant="outline" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Dream Job with{" "}
            <span className="text-green-400">PingJob</span>
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Connect with top companies, showcase your skills, and advance your career
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <Link href="/jobs">
                <Button size="lg" className="px-8">
                  <Search className="mr-2 h-5 w-5" />
                  Search Jobs
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          {platformStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {platformStats.activeJobs?.toLocaleString() || 0}
                </div>
                <div className="text-blue-100">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {platformStats.totalCompanies?.toLocaleString() || 0}
                </div>
                <div className="text-blue-100">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {platformStats.totalUsers?.toLocaleString() || 0}
                </div>
                <div className="text-blue-100">Professionals</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Job Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Popular Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories?.slice(0, 8).map((category: any) => (
                    <Link key={category.id} href={`/categories/${category.id}/jobs`}>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">
                          {category.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {category.job_count || 0}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Top Companies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCompanies?.slice(0, 10).map((company: any, index) => (
                    <div key={company.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 relative">
                        <div className="absolute -top-1 -left-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="w-10 h-8 border border-gray-200 rounded overflow-hidden bg-gray-50">
                          {company.logoUrl && company.logoUrl !== "NULL" ? (
                            <img 
                              src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                              alt={company.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xs">
                              {company.name?.[0]?.toUpperCase() || 'C'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {company.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" className="text-xs bg-green-600 text-white">
                            {company.jobCount || 0} jobs
                          </Badge>
                          <Badge variant="default" className="text-xs bg-blue-600 text-white">
                            {company.vendorCount || 0} vendors
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Job Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Job Opportunities
              </h2>
              <p className="text-gray-600 mt-2">
                Discover exciting career opportunities from top companies
              </p>
            </div>

            {jobsLoading ? (
              <div className="grid gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {jobs?.slice(0, 12).map((job: any) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link href={`/jobs/${job.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="text-gray-600 font-medium">
                            {job.companyName || "Company"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location || "Location not specified"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.employmentType || "Full-time"}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Recently posted
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!user && (
                            <Link href="/auth">
                              <Button variant="outline" size="sm">
                                <Heart className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            </Link>
                          )}
                          <Link href={`/jobs/${job.id}`}>
                            <Button size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                        {job.description ? 
                          job.description.substring(0, 150) + "..." : 
                          "Join our team and make an impact in this exciting role."
                        }
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {job.requirements && job.requirements.split(',').slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* View More Jobs Button */}
            <div className="mt-8 text-center">
              <Link href="/jobs">
                <Button size="lg">
                  View All Jobs
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of professionals who trust PingJob to advance their careers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link href="/auth">
                  <Button size="lg" variant="default">
                    Create Your Profile
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outline">
                    Explore Jobs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button size="lg" variant="default">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="lg" variant="outline">
                    Find Jobs
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="text-xl font-bold">PingJob</span>
              </div>
              <p className="text-gray-300 mb-4">
                The premier platform connecting talented professionals with leading companies.
              </p>
              <div className="flex space-x-4">
                <Link href="/about">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0">
                    About
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="link" className="text-gray-300 hover:text-white p-0">
                    Contact
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">For Job Seekers</h3>
              <div className="space-y-2">
                <Link href="/jobs" className="block text-gray-300 hover:text-white">Browse Jobs</Link>
                <Link href="/companies" className="block text-gray-300 hover:text-white">Companies</Link>
                <Link href="/auth" className="block text-gray-300 hover:text-white">Create Profile</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-gray-300 hover:text-white">Privacy Policy</Link>
                <Link href="/terms" className="block text-gray-300 hover:text-white">Terms of Service</Link>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-300">
                <p>support@pingjob.com</p>
                <p>San Francisco, CA</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PingJob. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
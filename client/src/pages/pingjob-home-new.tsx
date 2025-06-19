import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  Building2,
  Users,
  Briefcase,
  Eye,
  LogOut,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Globe,
  Mail,
  Phone,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  Star,
  Target,
  Zap,
  ChevronDown,
  Menu,
  X,
  Home,
  User,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  BookOpen,
  Bookmark,
  Share2,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function PingJobHomeNew() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showJobs, setShowJobs] = useState(true);
  const [showCompanies, setShowCompanies] = useState(true);
  const [featuredJobId, setFeaturedJobId] = useState<number | null>(null);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const jobsPerPage = 20;

  // Fetch platform statistics for home page
  const { data: platformStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/platform/stats'],
    queryFn: async () => {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30 seconds
  });

  // Fetch top companies
  const { data: companiesData } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies/top');
      return response.json();
    }
  });

  // Fetch jobs data
  const { data: jobsData } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    }
  });

  const displayStats = platformStats || {
    totalUsers: 0,
    totalCompanies: 0,
    activeJobs: 0
  };

  const jobs = jobsData || [];
  const companies = companiesData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <img src={logoPath} alt="PingJob" className="h-10 w-12 mr-3" />
              <span className="text-xl font-bold">PingJob</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="hover:text-blue-200">Home</a>
              <a href="#jobs" className="hover:text-blue-200">Jobs</a>
              <a href="#companies" className="hover:text-blue-200">Companies</a>
              <a href="#about" className="hover:text-blue-200">About</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm">Welcome, {user.firstName || user.email}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => logoutMutation.mutate()}
                    className="text-white border-white hover:bg-white hover:text-blue-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="py-20 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Dream Job
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect with top companies and discover career opportunities that match your skills and aspirations
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Search className="h-5 w-5 mr-2" />
                  Search Jobs
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 mr-2" />
                  <span className="text-3xl font-bold">{displayStats.totalUsers.toLocaleString()}</span>
                </div>
                <p className="text-blue-100">Active Job Seekers</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center justify-center mb-2">
                  <Building2 className="h-8 w-8 mr-2" />
                  <span className="text-3xl font-bold">{displayStats.totalCompanies.toLocaleString()}</span>
                </div>
                <p className="text-blue-100">Partner Companies</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center justify-center mb-2">
                  <Briefcase className="h-8 w-8 mr-2" />
                  <span className="text-3xl font-bold">{displayStats.activeJobs}</span>
                </div>
                <p className="text-blue-100">Open Positions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      {showCompanies && (
        <section className="bg-white border-b border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="mb-4" style={{backgroundColor: '#e53e3e', color: 'white', padding: '20px', fontSize: '24px', fontWeight: 'bold'}}>
                FRESH COMPONENT - Companies: {platformStats?.totalCompanies || 'Loading...'}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Top Companies ({displayStats.totalCompanies.toLocaleString()} total)
              </h2>
              <p className="text-lg text-gray-600">Discover leading companies with active job opportunities</p>
            </div>

            {/* Company Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {companies.slice(0, 20).map((company: any) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      {company.logoUrl && (
                        <img 
                          src={`/${company.logoUrl.replace(/ /g, '%20')}`}
                          alt={company.name}
                          className="w-16 h-12 object-contain mb-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{company.name}</h3>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {company.jobCount > 0 && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {company.jobCount} Jobs
                          </Badge>
                        )}
                        {company.vendorCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {company.vendorCount} Vendors
                          </Badge>
                        )}
                      </div>
                      {(company.city || company.state) && (
                        <p className="text-xs text-gray-500 mt-2">
                          {[company.city, company.state, company.zipCode, company.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/companies">
                <Button variant="outline" size="lg">
                  View All Companies
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs Section */}
      {showJobs && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Job Opportunities</h2>
              <p className="text-lg text-gray-600">Fresh positions from top companies</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.slice(0, 6).map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Building2 className="h-4 w-4 mr-1" />
                          <span>{job.companyName}</span>
                        </div>
                        {job.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{job.location}</span>
                          </div>
                        )}
                      </div>
                      {job.companyLogoUrl && (
                        <img 
                          src={`/${job.companyLogoUrl.replace(/ /g, '%20')}`}
                          alt={job.companyName}
                          className="w-12 h-9 object-contain"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {job.jobType && (
                          <Badge variant="secondary">{job.jobType}</Badge>
                        )}
                        {job.experienceLevel && (
                          <Badge variant="outline">{job.experienceLevel}</Badge>
                        )}
                      </div>
                      <Link href={`/job/${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/jobs">
                <Button size="lg">
                  View All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logoPath} alt="PingJob" className="h-8 w-10 mr-2" />
                <span className="text-lg font-bold">PingJob</span>
              </div>
              <p className="text-gray-400">
                Your gateway to career opportunities and professional growth.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white">Career Advice</a></li>
                <li><a href="#" className="hover:text-white">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Post Jobs</a></li>
                <li><a href="#" className="hover:text-white">Find Candidates</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
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
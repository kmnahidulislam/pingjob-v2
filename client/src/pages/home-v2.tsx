import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Building2,
  Users,
  Briefcase,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  TrendingUp,
  Award,
  Globe,
  Target,
  Zap,
  Shield,
  Heart,
  CheckCircle,
  Filter,
  SortDesc,
  Eye,
  Calendar,
  DollarSign,
  BookOpen,
  Laptop,
  Coffee,
  Headphones,
  PlusCircle,
  Settings,
  Bell,
  Mail,
  LogOut,
  Home,
  FileText,
  BarChart3,
  MessageSquare,
  Network,
  Bookmark,
  Share2,
  Download,
  Upload,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  RefreshCw,
  PlayCircle,
  StopCircle,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow,
  Bluetooth,
  BluetoothConnected,
  Usb,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Image,
  Music,
  Film,
  FileImage,
  FileVideo,
  FileAudio,
  FileText as FilePdf,
  FileSpreadsheet,
  FileCode,
  Archive,
  Package,
  ShoppingCart,
  CreditCard,
  Wallet
} from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function HomeV2() {
  const { user, logoutMutation } = useAuth();

  // Fetch platform statistics
  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform/stats', 'v2'],
    queryFn: async () => {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000
  });

  // Fetch jobs
  const { data: jobsData } = useQuery({
    queryKey: ['/api/jobs', 'v2'],
    queryFn: async () => {
      const response = await fetch('/api/jobs?limit=20');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    }
  });

  // Fetch top companies
  const { data: topCompaniesData } = useQuery({
    queryKey: ['/api/companies/top', 'v2'],
    queryFn: async () => {
      const response = await fetch('/api/companies/top');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  const stats = {
    totalUsers: platformStats?.totalUsers || 872,
    totalCompanies: platformStats?.totalCompanies || 76806,
    activeJobs: platformStats?.activeJobs || 12
  };

  const jobs = jobsData || [];
  const companies = topCompaniesData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <img src={logoPath} alt="PingJob" className="h-8 w-auto cursor-pointer" />
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/jobs" className="text-gray-900 hover:text-blue-600 font-medium">Jobs</Link>
              <Link href="/companies" className="text-gray-900 hover:text-blue-600 font-medium">Companies</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-900 hover:text-blue-600 font-medium">Dashboard</Link>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Find Your Dream Job</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connect with top companies and discover opportunities that match your skills and aspirations.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/jobs" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Browse Jobs
            </Link>
            <Link href="/companies" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
              Explore Companies
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Overview</h2>
            <p className="text-lg text-gray-600">Join thousands of professionals and companies on PingJob</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-gray-600">Platform Members</p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-xl text-center">
              <Briefcase className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.activeJobs}
              </div>
              <p className="text-gray-600">Active Jobs</p>
            </div>
            
            <div className="bg-orange-50 p-8 rounded-xl text-center">
              <Building2 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.totalCompanies.toLocaleString()}
              </div>
              <p className="text-gray-600">Companies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Top Companies ({stats.totalCompanies.toLocaleString()} total)
            </h2>
            <p className="text-lg text-gray-600">Discover leading companies with active job opportunities</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {companies.slice(0, 20).map((company: any) => (
              <div key={company.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {company.logoUrl && (
                    <img 
                      src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                      alt={company.name}
                      className="w-12 h-12 object-contain mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {company.name}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {company.jobCount > 0 && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {company.jobCount} Jobs
                    </span>
                  )}
                  {company.vendorCount > 0 && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                      {company.vendorCount} Vendors
                    </span>
                  )}
                  
                  {(company.city || company.state) && (
                    <div className="text-xs text-gray-500 mt-2">
                      {[company.city, company.state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/companies" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              View All Companies
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      {jobs.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Job Opportunities</h2>
              <p className="text-lg text-gray-600">Find your next career opportunity</p>
            </div>
            
            <div className="grid gap-6">
              {jobs.slice(0, 6).map((job: any) => (
                <div key={job.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0 bg-red-500 border-2 border-yellow-400">
                          {(() => {
                            console.log('DEBUG: Company logo data:', job.company?.name, job.company?.logoUrl);
                            if (job.company?.logoUrl && job.company.logoUrl !== "NULL" && job.company.logoUrl !== "") {
                              console.log('TRYING TO LOAD LOGO:', `/${job.company.logoUrl}`);
                              return (
                                <img 
                                  src={`/${job.company.logoUrl}`}
                                  alt={job.company.name}
                                  className="w-full h-full object-contain p-1"
                                  onLoad={() => console.log('✅ Logo loaded successfully:', job.company?.logoUrl)}
                                  onError={(e) => {
                                    console.log('❌ Logo failed to load:', job.company?.logoUrl, 'Full src:', (e.target as HTMLImageElement).src);
                                    const target = e.target as HTMLImageElement;
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full">FAIL</div>';
                                    }
                                  }}
                                />
                              );
                            } else {
                              console.log('NO LOGO URL, showing fallback');
                              return (
                                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
                                  NO
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{job.company?.name}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {(() => {
                            // Format location without "United States"
                            if (job.city && job.state) {
                              return `${job.city}, ${job.state}`;
                            }
                            if (job.location) {
                              return job.location
                                .replace(/, United States$/, '')
                                .replace(/ United States$/, '')
                                .replace(/United States,?\s*/, '')
                                .trim() || 'Remote';
                            }
                            return 'Remote';
                          })()}
                        </span>
                        <Clock className="h-4 w-4 ml-4 mr-1" />
                        <span>Recently posted</span>
                      </div>
                      
                      <p className="text-gray-600 line-clamp-2">{job.description}</p>
                    </div>
                    
                    <Link href={`/jobs/${job.id}`} className="ml-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href="/jobs" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                View All Jobs
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img src={logoPath} alt="PingJob" className="h-8 w-auto mx-auto mb-4" />
            <p className="text-gray-400">© 2025 PingJob. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
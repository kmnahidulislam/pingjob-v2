import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Users,
  Briefcase,
  MessageCircle,
  Building,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  BarChart3
} from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const isAdmin = true; // Temporarily enable admin features for testing

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Network", href: "/network", icon: Users },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Messaging", href: "/messaging", icon: MessageCircle },
    { name: "Companies", href: "/companies", icon: Building },
    ...(isAdmin ? [{ name: "Dashboard", href: "/dashboard", icon: BarChart3 }] : []),
  ];

  // Global search for both companies and jobs
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: searchQuery.trim().length > 2,
    staleTime: 0,
    gcTime: 0,
  });

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      // Navigate to companies page with search query - the page will handle both companies and jobs
      window.location.href = `/companies?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 2);
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
    setSearchFocus(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (!searchFocus) {
        closeSearchResults();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [searchFocus]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-linkedin-blue hover:text-linkedin-dark transition-colors">
                PingJob
              </h1>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md transition-colors duration-200 cursor-pointer ${
                      isActive(item.href)
                        ? "text-linkedin-blue"
                        : "text-gray-600 hover:text-linkedin-blue"
                    }`}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div className="relative hidden md:block">
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search companies, jobs, locations..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </form>

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim().length > 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-linkedin-blue mx-auto mb-2"></div>
                      Searching...
                    </div>
                  ) : searchResults ? (
                    <div className="py-2">
                      {/* Companies Section */}
                      {searchResults.companies && searchResults.companies.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                            Companies ({searchResults.companies.length})
                          </div>
                          {searchResults.companies.slice(0, 5).map((company: any) => (
                            <Link 
                              key={company.id} 
                              href={`/companies?search=${encodeURIComponent(searchQuery)}`}
                              onClick={closeSearchResults}
                            >
                              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                  <Building className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <div className="font-medium text-gray-900">{company.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {company.industry} • {company.city}, {company.state}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {searchResults.companies.length > 5 && (
                            <Link 
                              href={`/companies?search=${encodeURIComponent(searchQuery)}`}
                              onClick={closeSearchResults}
                            >
                              <div className="px-4 py-2 text-sm text-linkedin-blue hover:bg-gray-50 cursor-pointer">
                                View all {searchResults.companies.length} companies →
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Jobs Section */}
                      {searchResults.jobs && searchResults.jobs.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                            Jobs ({searchResults.jobs.length})
                          </div>
                          {searchResults.jobs.slice(0, 5).map((job: any) => (
                            <Link 
                              key={job.id} 
                              href={`/jobs?search=${encodeURIComponent(searchQuery)}`}
                              onClick={closeSearchResults}
                            >
                              <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                  <Briefcase className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <div className="font-medium text-gray-900">{job.title}</div>
                                    <div className="text-sm text-gray-500">
                                      {job.company?.name} • {job.city}, {job.state}
                                      {job.salary && <span> • ${job.salary}k</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {searchResults.jobs.length > 5 && (
                            <Link 
                              href={`/jobs?search=${encodeURIComponent(searchQuery)}`}
                              onClick={closeSearchResults}
                            >
                              <div className="px-4 py-2 text-sm text-linkedin-blue hover:bg-gray-50 cursor-pointer">
                                View all {searchResults.jobs.length} jobs →
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {/* No Results */}
                      {(!searchResults.companies || searchResults.companies.length === 0) && 
                       (!searchResults.jobs || searchResults.jobs.length === 0) && (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>No results found for "{searchQuery}"</p>
                          <p className="text-sm mt-1">Try different keywords or check spelling</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-600 hover:text-linkedin-blue" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-error-red text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-linkedin-blue text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user?.id}`} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/company/create" className="cursor-pointer">
                    <Building className="h-4 w-4 mr-2" />
                    Create Company
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="cursor-pointer text-error-red">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <div className={`flex flex-col items-center space-y-1 px-3 py-2 transition-colors duration-200 ${
                isActive(item.href)
                  ? "text-linkedin-blue"
                  : "text-gray-600"
              }`}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

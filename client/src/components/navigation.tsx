import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  BarChart3,
  FileText
} from "lucide-react";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com' || user?.userType === 'recruiter' || user?.userType === 'client';

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Network", href: "/network", icon: Users },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Applications", href: "/applications", icon: FileText },
    { name: "Messaging", href: "/messaging", icon: MessageCircle },
    { name: "Companies", href: "/companies", icon: Building },
    ...(user?.userType === 'recruiter' ? [{ name: "Recruiter Dashboard", href: "/recruiter-dashboard", icon: BarChart3 }] : []),
    ...(isAdmin ? [{ name: "Dashboard", href: "/dashboard", icon: BarChart3 }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Check current page to determine default search behavior
      if (location.includes('/companies')) {
        // If on companies page, search companies
        window.location.href = `/companies?search=${encodeURIComponent(searchQuery)}`;
      } else {
        // Default to jobs search for all other pages
        // Try to intelligently separate location from keywords
        const query = searchQuery.trim();
        const words = query.split(' ');
        
        // Common location patterns - check if last 1-2 words are location
        const locationIndicators = ['ny', 'ca', 'tx', 'fl', 'il', 'pa', 'oh', 'michigan', 'california', 'texas', 'florida', 'new york', 'los angeles', 'chicago', 'houston', 'philadelphia', 'detroit', 'denver', 'seattle', 'atlanta', 'boston', 'dallas', 'miami', 'phoenix', 'san francisco', 'new jersey', 'virginia', 'north carolina', 'south carolina', 'washington', 'oregon', 'nevada', 'utah', 'colorado', 'arizona', 'maryland', 'massachusetts', 'connecticut', 'louisiana', 'alabama', 'georgia', 'tennessee', 'kentucky', 'indiana', 'missouri', 'minnesota', 'wisconsin', 'iowa', 'kansas', 'nebraska', 'south dakota', 'north dakota', 'montana', 'wyoming', 'idaho', 'arkansas', 'mississippi', 'oklahoma', 'new mexico', 'alaska', 'hawaii', 'maine', 'new hampshire', 'vermont', 'rhode island', 'delaware', 'west virginia'];
        
        let searchTerm = query;
        let locationTerm = '';
        
        // Check if query contains location indicators
        const lowerQuery = query.toLowerCase();
        const foundLocation = locationIndicators.find(loc => lowerQuery.includes(loc.toLowerCase()));
        
        if (foundLocation) {
          // Split the query into search term and location
          const locationIndex = lowerQuery.indexOf(foundLocation.toLowerCase());
          if (locationIndex > 0) {
            searchTerm = query.substring(0, locationIndex).trim();
            locationTerm = query.substring(locationIndex).trim();
          } else {
            // Location is at the beginning, use the whole query as location
            searchTerm = '';
            locationTerm = query;
          }
        }
        
        // Build URL with separated search and location parameters
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (locationTerm) params.set('location', locationTerm);
        if (!searchTerm && !locationTerm) params.set('search', query);
        
        window.location.href = `/jobs?${params.toString()}`;
      }
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

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
                  placeholder={location.includes('/companies') ? "Search companies..." : "Search jobs, companies, locations..."}
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:border-transparent"
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </form>
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
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
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

import React, { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import PublicHome from "@/pages/public-home";
import PingJobHome from "@/pages/pingjob-home";
import TestSimpleHome from "@/pages/test-simple-home";
import PingJobHomeSimple from "@/pages/pingjob-home-simple";
import HomeV2 from "@/pages/home-v2";
import TestMinimal from "@/pages/test-minimal";
import TestAuth from "@/pages/test-auth";
import ManualAssignments from "@/pages/manual-assignments";
import PingJobHomeDebug from "@/pages/pingjob-home-debug";
import Profile from "@/pages/profile";
import JobsOriginal from "@/pages/jobs-original";
import JobCreate from "@/pages/job-create";
import Applications from "@/pages/applications";
import NetworkPage from "@/pages/network-page";
import Messaging from "@/pages/messaging";
import Companies from "@/pages/companies";
import CompanyCreate from "@/pages/company-create";
import Dashboard from "@/pages/dashboard";
import JobDetails from "@/pages/job-details";
import CategoryJobsPage from "@/pages/category-jobs-page";
import InvitationAccept from "@/pages/invitation-accept";
import SocialMediaTest from "@/pages/social-media-test";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Contact from "@/pages/contact";
import ContactSales from "@/pages/contact-sales";
import Pricing from "@/pages/pricing";
import Auth from "@/pages/auth";
import Checkout from "@/pages/checkout";
import VisitStats from "@/pages/visit-stats";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";

import RecruiterDashboard from "@/pages/recruiter-dashboard";
import EnterpriseDashboard from "@/pages/enterprise-dashboard";
import Navigation from "@/components/navigation";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { useVisitTracker } from "@/hooks/use-visit-tracker";
import { initializeAdSense } from "./lib/adsense";




function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navigation />}
      <main className={user ? "pt-16" : ""}>
        {children}
      </main>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Track page views when routes change
  useAnalytics();
  // Track visits for analytics (temporarily disabled due to import issue)
  // useVisitTracker();

  // Handle navigation using useEffect to prevent setState during render
  useEffect(() => {
    if (location.startsWith('/api/')) {
      navigate('/');
    } else if (user && location === '/auth') {
      navigate('/dashboard');
    }
  }, [location, user, navigate]);

  // Router state tracking
  
  // Special handling for public routes that don't require authentication
  const isPublicRoute = location === '/reset-password' || 
                       location.startsWith('/reset-password?') || 
                       location === '/forgot-password' ||
                       location === '/auth' ||
                       location === '/about' ||
                       location === '/privacy' ||
                       location === '/terms' ||
                       location === '/contact' ||
                       location === '/contact-sales' ||
                       location === '/pricing' ||
                       location.startsWith('/jobs/') ||
                       location.startsWith('/categories/') ||
                       location.startsWith('/invite/') ||
                       location === '/companies' ||
                       location === '/jobs' ||
                       location === '/';

  if (isPublicRoute && !user) {
    // Handle specific public routes
    if (location === '/reset-password' || location.startsWith('/reset-password?')) {
      return (
        <div className="min-h-screen bg-gray-50">
          <ResetPassword />
        </div>
      );
    }
    
    if (location === '/forgot-password') {
      return (
        <div className="min-h-screen bg-gray-50">
          <ForgotPassword />
        </div>
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/jobs/:id" component={JobDetails} />
          <Route path="/categories/:categoryId/jobs" component={CategoryJobsPage} />
          <Route path="/invite/:token" component={InvitationAccept} />
          <Route path="/auth" component={Auth} />
          <Route path="/about" component={About} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/contact" component={Contact} />
          <Route path="/contact-sales" component={ContactSales} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/companies" component={Companies} />
          <Route path="/jobs" component={JobsOriginal} />
          <Route path="/test-minimal" component={TestMinimal} />
          <Route path="/test-auth" component={TestAuth} />
          <Route path="/manual-assignments" component={ManualAssignments} />

          <Route path="/" component={Home} />
          <Route><Redirect to="/" /></Route>
        </Switch>
      </div>
    );
  }

  // User authenticated - showing protected routes
  
  // Don't render protected routes if we're still on /auth page (redirect is happening)
  if (location === '/auth') {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedLayout>
        <Switch>
          <Route path="/jobs/:id" component={JobDetails} />
          <Route path="/categories/:categoryId/jobs" component={CategoryJobsPage} />
          <Route path="/job-create" component={JobCreate} />
          <Route path="/jobs" component={JobsOriginal} />
          <Route path="/company/create" component={CompanyCreate} />
          <Route path="/companies/create" component={CompanyCreate} />
          <Route path="/companies" component={Companies} />
          <Route path="/profile/:id?" component={Profile} />
          <Route path="/applications" component={Applications} />
          <Route path="/network" component={NetworkPage} />
          <Route path="/messaging" component={Messaging} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/recruiter-dashboard" component={RecruiterDashboard} />
          <Route path="/enterprise-dashboard" component={EnterpriseDashboard} />
          <Route path="/social-media-test" component={SocialMediaTest} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/visit-stats" component={VisitStats} />
          <Route path="/traffic" component={VisitStats} />
          <Route path="/manual-assignments" component={ManualAssignments} />
          <Route path="/about" component={About} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/contact" component={Contact} />
          <Route path="/contact-sales" component={ContactSales} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/" component={Dashboard} />
          <Route>
            {() => {
              console.log('Fallback route hit for:', location);
              return <NotFound />;
            }}
          </Route>
        </Switch>
      </ProtectedLayout>
    </div>
  );
}

function App() {
  // Initialize Google Analytics and AdSense when app starts
  useEffect(() => {
    // Temporarily disable Google Analytics to prevent rate limiting issues
    // Initialize Google Analytics with error handling
    try {
      if (false && import.meta.env.VITE_GA_MEASUREMENT_ID) {
        setTimeout(() => initGA(), 100); // Delay to avoid blocking
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Google Analytics initialization failed:', error);
      }
    }
    
    // Initialize Google AdSense with error handling
    try {
      if (import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID) {
        setTimeout(() => initializeAdSense(), 200); // Delay to avoid blocking
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Google AdSense initialization failed:', error);
      }
    }
    
    // Initialize Capacitor when app starts (only in mobile environment)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      import('./capacitor').then(({ CapacitorService }) => {
        CapacitorService.initialize().catch(console.error);
      }).catch(() => {
        // Capacitor not available in web environment, continue normally
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

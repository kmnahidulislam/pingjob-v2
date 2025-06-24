import { useEffect } from "react";
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
import PingJobHome from "@/pages/pingjob-home";
import HomeV2 from "@/pages/home-v2";
import Profile from "@/pages/profile";
import Jobs from "@/pages/jobs";
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
import Navigation from "@/components/navigation";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initializeAdSense } from "./lib/adsense";



function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16">
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

  console.log('Router - User:', user, 'Loading:', isLoading, 'Location:', location);

  // Handle navigation using useEffect to prevent setState during render
  useEffect(() => {
    if (location.startsWith('/api/')) {
      console.log('API route detected, redirecting to home');
      navigate('/');
    } else if (user && location === '/auth') {
      console.log('Authenticated user on auth page, redirecting to home');
      navigate('/');
    }
  }, [location, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing public pages');
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
          <Route path="/" component={PingJobHome} />
          <Route><Redirect to="/" /></Route>
        </Switch>
      </div>
    );
  }

  console.log('User authenticated, showing protected routes for location:', location);
  
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
          <Route path="/jobs" component={Jobs} />
          <Route path="/company/create" component={CompanyCreate} />
          <Route path="/companies/create" component={CompanyCreate} />
          <Route path="/companies" component={Companies} />
          <Route path="/profile/:id?" component={Profile} />
          <Route path="/applications" component={Applications} />
          <Route path="/network" component={NetworkPage} />
          <Route path="/messaging" component={Messaging} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/social-media-test" component={SocialMediaTest} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/about" component={About} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/contact" component={Contact} />
          <Route path="/contact-sales" component={ContactSales} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/" component={Home} />
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
  // Initialize Google Analytics and AdSense when app loads
  useEffect(() => {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }

    // Initialize Google AdSense
    if (!import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID) {
      console.warn('Missing required Google AdSense client ID: VITE_GOOGLE_ADSENSE_CLIENT_ID');
    } else {
      initializeAdSense();
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

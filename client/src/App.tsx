import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/test-home";
import Profile from "@/pages/profile";
import Jobs from "@/pages/jobs";
import JobCreate from "@/pages/job-create";
import Applications from "@/pages/applications";
import Network from "@/pages/network";
import Messaging from "@/pages/messaging";
import Companies from "@/pages/companies";
import CompanyCreate from "@/pages/company-create";
import Dashboard from "@/pages/dashboard";
import Navigation from "@/components/navigation";



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

  console.log('Router - User:', user, 'Loading:', isLoading, 'Location:', window.location.pathname);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('No user, showing auth page');
    return (
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route><Redirect to="/auth" /></Route>
        </Switch>
      </div>
    );
  }

  console.log('User authenticated, showing protected routes');
  
  return (
    <Switch>
      <Route path="/auth"><Redirect to="/" /></Route>
      <Route path="/jobs/:id">
        <ProtectedLayout><Jobs /></ProtectedLayout>
      </Route>
      <Route path="/job-create">
        <ProtectedLayout><JobCreate /></ProtectedLayout>
      </Route>
      <Route path="/jobs">
        <ProtectedLayout><Jobs /></ProtectedLayout>
      </Route>
      <Route path="/company/create">
        <ProtectedLayout><CompanyCreate /></ProtectedLayout>
      </Route>
      <Route path="/companies">
        <ProtectedLayout><Companies /></ProtectedLayout>
      </Route>
      <Route path="/profile/:id?">
        <ProtectedLayout><Profile /></ProtectedLayout>
      </Route>
      <Route path="/applications">
        <ProtectedLayout><Applications /></ProtectedLayout>
      </Route>
      <Route path="/network">
        <ProtectedLayout><Network /></ProtectedLayout>
      </Route>
      <Route path="/messaging">
        <ProtectedLayout><Messaging /></ProtectedLayout>
      </Route>
      <Route path="/dashboard">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

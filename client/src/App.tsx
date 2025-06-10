import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/auth">
          {user ? <Redirect to="/" /> : <AuthPage />}
        </Route>
        
        <Route path="/">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Home />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/profile/:id?">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/jobs/:id">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Jobs />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/jobs">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Jobs />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/job-create">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <JobCreate />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/applications">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Applications />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/network">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Network />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/messaging">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Messaging />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/companies">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Companies />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/company/create">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <CompanyCreate />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route path="/dashboard">
          {!user ? <Redirect to="/auth" /> : (
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          )}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </div>
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

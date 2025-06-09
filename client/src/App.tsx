import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
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

function Router() {
  return (
    <div className="min-h-screen bg-bg-light">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/profile/:id?" component={Profile} />
        <ProtectedRoute path="/jobs/:id" component={Jobs} />
        <ProtectedRoute path="/jobs" component={Jobs} />
        <ProtectedRoute path="/job-create" component={JobCreate} />
        <ProtectedRoute path="/applications" component={Applications} />
        <ProtectedRoute path="/network" component={Network} />
        <ProtectedRoute path="/messaging" component={Messaging} />
        <ProtectedRoute path="/companies" component={Companies} />
        <ProtectedRoute path="/company/create" component={CompanyCreate} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
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

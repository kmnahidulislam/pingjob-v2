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
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={() => (
          <ProtectedLayout><Home /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/profile/:id?" component={() => (
          <ProtectedLayout><Profile /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/jobs/:id" component={() => (
          <ProtectedLayout><Jobs /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/jobs" component={() => (
          <ProtectedLayout><Jobs /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/job-create" component={() => (
          <ProtectedLayout><JobCreate /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/applications" component={() => (
          <ProtectedLayout><Applications /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/network" component={() => (
          <ProtectedLayout><Network /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/messaging" component={() => (
          <ProtectedLayout><Messaging /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/companies" component={() => (
          <ProtectedLayout><Companies /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/company/create" component={() => (
          <ProtectedLayout><CompanyCreate /></ProtectedLayout>
        )} />
        <ProtectedRoute path="/dashboard" component={() => (
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        )} />
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

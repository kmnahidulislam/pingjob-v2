import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "job_seeker" | "recruiter" | "client" | "admin";
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry failed auth requests
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      if (import.meta.env.DEV) console.log('🔐 Login success callback, user:', user);
      // Update auth state immediately
      queryClient.setQueryData(["/api/user"], user);
      
      // Check for post-auth redirect
      const postAuthRedirect = localStorage.getItem('postAuthRedirect');
      const pendingJobApplication = localStorage.getItem('pendingJobApplication');
      
      if (import.meta.env.DEV) console.log('🔐 Checking redirects - postAuthRedirect:', postAuthRedirect, 'pendingJobApplication:', pendingJobApplication);
      
      if (postAuthRedirect) {
        localStorage.removeItem('postAuthRedirect');
        if (import.meta.env.DEV) console.log('🔐 Navigating to stored redirect:', postAuthRedirect);
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (import.meta.env.DEV) console.log('🔐 Actually redirecting to:', postAuthRedirect);
          window.location.href = postAuthRedirect;
        }, 100);
        return;
      }
      
      if (pendingJobApplication) {
        localStorage.removeItem('pendingJobApplication');
        if (import.meta.env.DEV) console.log('🔐 Navigating to pending job application:', pendingJobApplication);
        setTimeout(() => {
          window.location.href = `/jobs/${pendingJobApplication}`;
        }, 100);
        return;
      }
      
      // Fallback: Check for legacy intended job redirect
      const intendedJobId = localStorage.getItem('intendedJobId');
      if (intendedJobId) {
        localStorage.removeItem('intendedJobId');
        if (import.meta.env.DEV) console.log('🔐 Navigating to intended job:', intendedJobId);
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          window.location.href = `/jobs/${intendedJobId}`;
        }, 100);
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Default redirect to dashboard
      if (import.meta.env.DEV) console.log('🔐 No intended job, navigating to dashboard...');
      if (import.meta.env.DEV) console.log('🔐 Setting location to /dashboard');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Check for intended job redirect
      const intendedJobId = localStorage.getItem('intendedJobId');
      if (intendedJobId) {
        localStorage.removeItem('intendedJobId');
        if (import.meta.env.DEV) console.log('🔐 New user, navigating to intended job:', intendedJobId);
        setTimeout(() => {
          window.location.href = `/jobs/${intendedJobId}`;
        }, 100);
        return;
      }
      
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      
      // Default redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
      // Don't parse JSON if response is empty
      try {
        return await res.json();
      } catch {
        return {}; // Return empty object if no JSON content
      }
    },
    onSuccess: () => {
      // Immediately clear all cached data
      queryClient.clear();
      queryClient.removeQueries();
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear any localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Force complete page reload to reset all state
      window.location.replace("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
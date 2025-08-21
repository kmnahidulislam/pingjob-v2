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
      if (import.meta.env.DEV) console.log('🔐 Login success callback executing, user:', user);
      
      // Update auth state
      queryClient.setQueryData(["/api/user"], user);
      
      // Check for redirect IMMEDIATELY
      const redirectPath = localStorage.getItem('postAuthRedirect');
      if (import.meta.env.DEV) console.log('🔐 Checking for redirect:', redirectPath);
      
      if (redirectPath) {
        if (import.meta.env.DEV) console.log('🔐 REDIRECT FOUND! Going to:', redirectPath);
        localStorage.removeItem('postAuthRedirect');
        window.location.href = redirectPath;
        return;
      }
      
      // No redirect, show success message and go to dashboard
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      if (import.meta.env.DEV) console.log('🔐 No redirect, going to dashboard');
      window.location.href = '/dashboard';
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
      if (import.meta.env.DEV) console.log('🔐 Starting registration for:', credentials.email, credentials.userType);
      
      // Use direct fetch to handle 402 responses before apiRequest processes them
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (import.meta.env.DEV) console.log('🔐 Registration response status:', res.status);
      
      const responseData = await res.json();
      if (import.meta.env.DEV) console.log('🔐 Registration response data:', responseData);
      
      if (!res.ok) {
        // Handle payment required for premium accounts FIRST
        if (res.status === 402 && responseData.requiresPayment) {
          if (import.meta.env.DEV) console.log('🔐 Premium account - processing payment redirect:', responseData);
          
          // Store user data for payment flow
          localStorage.setItem('pendingUserData', JSON.stringify(responseData.userData));
          localStorage.setItem('pendingUserType', responseData.userType);
          
          if (import.meta.env.DEV) console.log('🔐 Stored pending data, initiating redirect to /checkout');
          
          // Redirect immediately and return success to prevent error handling
          window.location.href = '/checkout';
          
          // Return a success response to avoid error state
          return { redirect: true, message: 'Redirecting to payment page...', success: true };
        }
        
        // For other errors, throw normally
        throw new Error(responseData.message || "Registration failed");
      }
      
      if (import.meta.env.DEV) console.log('🔐 Registration successful:', responseData);
      return responseData;
    },
    onSuccess: (response: any) => {
      // Handle payment redirect response
      if (response?.redirect) {
        if (import.meta.env.DEV) console.log('🔐 Payment redirect successful:', response.message);
        // Don't show toast or redirect - user is already being redirected to checkout
        return;
      }
      
      // Normal registration success
      const user = response as SelectUser;
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
      if (import.meta.env.DEV) console.log('🔐 Registration mutation error:', error);
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
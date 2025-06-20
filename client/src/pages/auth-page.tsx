import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Briefcase, Users, Building2, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userType: z.enum(["job_seeker", "recruiter", "client", "admin"]),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "job_seeker",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Password reset mutations
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof forgotPasswordSchema>) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset sent",
        description: data.message,
      });
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setShowResetPassword(true);
        setShowForgotPassword(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resetPasswordSchema>) => {
      const res = await apiRequest("POST", "/api/reset-password", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      setShowResetPassword(false);
      setShowForgotPassword(false);
      setActiveTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  const onRegister = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Logo Header */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <img 
            src={logoPath} 
            alt="PingJob Logo" 
            className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
      
      <div className="flex items-center justify-center p-4 flex-1">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <div className="hidden lg:block space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Connect with Your Future
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of professionals building meaningful careers through our comprehensive networking platform.
              </p>
            </div>
            
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Discover Opportunities</h3>
                    <p className="text-gray-600 dark:text-gray-300">Access thousands of job listings from top companies worldwide.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Build Networks</h3>
                    <p className="text-gray-600 dark:text-gray-300">Connect with professionals in your industry and expand your reach.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Company Insights</h3>
                    <p className="text-gray-600 dark:text-gray-300">Get detailed information about companies and their culture.</p>
                  </div>
                </div>
              </div>
            </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {showForgotPassword ? "Reset Password" : showResetPassword ? "Create New Password" : "Welcome"}
              </CardTitle>
              <CardDescription>
                {showForgotPassword 
                  ? "Enter your email to receive a password reset link"
                  : showResetPassword 
                  ? "Enter your new password"
                  : "Sign in to your account or create a new one"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className="mb-4"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                  
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit((data) => forgotPasswordMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={forgotPasswordMutation.isPending}
                      >
                        {forgotPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                      </Button>
                    </form>
                  </Form>
                </div>
              ) : showResetPassword ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowResetPassword(false);
                      setShowForgotPassword(false);
                    }}
                    className="mb-4"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                  
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit((data) => {
                      resetPasswordMutation.mutate({
                        ...data,
                        token: resetToken || data.token,
                      });
                    })} className="space-y-4">
                      {!resetToken && (
                        <FormField
                          control={resetPasswordForm.control}
                          name="token"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reset Token</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter reset token" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={resetPasswordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={resetPasswordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset Password
                      </Button>
                    </form>
                  </Form>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                      </Button>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          try {
                            // Test if Google OAuth is available first
                            const response = await fetch('/api/auth/google', { method: 'HEAD' });
                            if (response.status === 302 || response.ok) {
                              window.location.href = '/api/auth/google';
                            } else {
                              throw new Error('Google OAuth not available');
                            }
                          } catch (error) {
                            console.error('Google OAuth error:', error);
                            // Fallback to direct redirect
                            window.location.href = '/api/auth/google';
                          }
                        }}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm"
                        >
                          Forgot your password?
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a strong password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="userType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="job_seeker">Job Seeker</SelectItem>
                                <SelectItem value="recruiter">Recruiter</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
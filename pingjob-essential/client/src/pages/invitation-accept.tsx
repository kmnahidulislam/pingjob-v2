import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";

interface InvitationData {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  message: string | null;
  inviterUserId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function InvitationAccept() {
  const [, params] = useRoute('/invite/:token');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (params?.token) {
      fetchInvitation(params.token);
    }
  }, [params?.token]);

  const fetchInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/external-invitations/${token}/details`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
        setRegistrationData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || ''
        }));
      } else {
        setError('Invitation not found or expired');
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!params?.token) return;
    
    if (registrationData.password !== registrationData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (registrationData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setAccepting(true);
    try {
      // Accept invitation and create account
      const response = await apiRequest('POST', `/api/external-invitations/${params.token}/accept`, {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        password: registrationData.password
      });

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Welcome to PingJob!",
          description: "Your account has been created successfully"
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          setLocation('/auth');
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Welcome to PingJob!</CardTitle>
            <CardDescription>
              Your account has been created successfully. You'll be redirected to login shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>Join PingJob</CardTitle>
          <CardDescription>
            You've been invited to join our professional networking platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {invitation?.message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 italic">"{invitation.message}"</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={registrationData.firstName}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    firstName: e.target.value
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={registrationData.lastName}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    lastName: e.target.value
                  }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={registrationData.password}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                required
                minLength={6}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={registrationData.confirmPassword}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                required
                minLength={6}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAcceptInvitation}
            disabled={accepting || !registrationData.firstName || !registrationData.password}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Accept Invitation & Create Account'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
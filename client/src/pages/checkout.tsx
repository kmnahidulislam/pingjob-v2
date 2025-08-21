import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, CreditCard, Shield, Clock } from "lucide-react";
import logo from "@assets/logo_1749581218265.png";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Check if this is from registration flow
      const pendingUserData = localStorage.getItem('pendingUserData');
      const pendingUserType = localStorage.getItem('pendingUserType');
      
      if (pendingUserData && pendingUserType) {
        // Create premium account after successful payment
        try {
          const userData = JSON.parse(pendingUserData);
          const res = await fetch('/api/create-premium-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...userData,
              userType: pendingUserType,
              paymentConfirmed: true
            })
          });
          
          if (res.ok) {
            // Clear pending data
            localStorage.removeItem('pendingUserData');
            localStorage.removeItem('pendingUserType');
            
            toast({
              title: "Account Created Successfully!",
              description: `Welcome to PingJob! Your ${pendingUserType === 'recruiter' ? 'Recruiter Pro' : 'Enterprise Client'} account is now active.`,
            });
          } else {
            throw new Error('Failed to create account');
          }
        } catch (error) {
          toast({
            title: "Account Creation Failed",
            description: "Payment was successful but account creation failed. Please contact support.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to PingJob Pro! Your subscription is now active.",
        });
      }
      
      setLocation("/dashboard");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <PaymentElement />
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secured with 256-bit SSL encryption</span>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Start Subscription
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By confirming your subscription, you allow PingJob to charge your card for this payment and future payments in accordance with their terms.
      </p>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get plan from URL parameters or localStorage (from registration flow)
  const urlParams = new URLSearchParams(window.location.search);
  const urlPlan = urlParams.get("plan");
  const pendingUserType = localStorage.getItem('pendingUserType');
  const plan = urlPlan || pendingUserType || "recruiter";

  const planDetails = {
    recruiter: {
      name: "Recruiter",
      subtitle: "For recruiting professionals and HR teams",
      price: "$19",
      period: "month",
      features: [
        "Post up to 10 jobs per month",
        "Access to candidate database",
        "Advanced search filters",
        "Resume parsing and ranking",
        "Candidate application management",
        "Interview scheduling tools",
        "Team collaboration features",
        "Analytics and reporting",
        "Priority email support"
      ],
      limitations: [
        "Limited to 10 job postings",
        "Basic analytics only"
      ]
    },
    client: {
      name: "Enterprise Client",
      price: "$199",
      period: "month",
      features: [
        "Premium company profile",
        "Featured job listings",
        "Advanced employer branding",
        "Priority candidate access",
        "Dedicated account manager",
        "Custom integration support",
        "Advanced analytics dashboard"
      ]
    }
  };

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-subscription", { plan })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Failed to initialize payment");
        }
      })
      .catch((error) => {
        toast({
          title: "Payment Setup Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [plan, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="text-red-600 mb-4">Unable to initialize payment</p>
            <Link href="/pricing">
              <Button>Back to Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src={logo} alt="PingJob" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900">PingJob</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
          <p className="text-gray-600">Get started with PingJob today</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentPlan.name}</CardTitle>
                {currentPlan.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{currentPlan.subtitle}</p>
                )}
                <div className="text-2xl font-bold mt-2">
                  {currentPlan.price}
                  <span className="text-sm font-normal text-gray-500">/{currentPlan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {currentPlan.limitations && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Limitations:</h4>
                    <ul className="space-y-1">
                      {currentPlan.limitations.map((limitation, index) => (
                        <li key={index} className="text-sm text-orange-700">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Complete your payment to activate your subscription immediately.
                </p>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#3b82f6',
                    }
                  }
                }}>
                  <CheckoutForm plan={plan} />
                </Elements>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Link href="/pricing">
                <Button variant="ghost">← Back to Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
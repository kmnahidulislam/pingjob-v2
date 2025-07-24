import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Users, Building, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function Pricing() {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [, setLocation] = useLocation();

  const handlePlanSelection = (planName: string) => {
    if (planName === "Job Seeker") {
      // Free plan - redirect to registration
      setLocation('/auth');
    } else if (planName === "Recruiter") {
      // Paid plan - redirect to checkout
      if (user) {
        setLocation('/checkout?plan=recruiter');
      } else {
        setLocation('/auth');
      }
    } else if (planName === "Enterprise Client") {
      // Enterprise plan - redirect to checkout
      if (user) {
        setLocation('/checkout?plan=enterprise');
      } else {
        setLocation('/auth');
      }
    }
  };

  const plans = [
    {
      name: "Job Seeker",
      description: "Perfect for individuals looking for their next opportunity",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      price: billingPeriod === 'monthly' ? 0 : 0,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      popular: false,
      features: [
        "Create professional profile",
        "Apply to unlimited jobs",
        "Access to job search filters",
        "Basic networking features",
        "Email notifications",
        "Resume upload and storage",
        "Job application tracking"
      ],
      limitations: [
        "Limited profile visibility",
        "Basic search results",
        "No priority support"
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const
    },
    {
      name: "Recruiter",
      description: "For recruiting professionals and HR teams",
      icon: <Building className="h-8 w-8 text-green-600" />,
      price: billingPeriod === 'monthly' ? 99 : 990,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      popular: true,
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
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const
    },
    {
      name: "Enterprise Client",
      description: "For large organizations with high-volume hiring needs",
      icon: <Crown className="h-8 w-8 text-purple-600" />,
      price: billingPeriod === 'monthly' ? 299 : 2990,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      popular: false,
      features: [
        "Unlimited job postings",
        "Full access to candidate database",
        "Advanced analytics and insights",
        "Custom branding options",
        "API access for integrations",
        "Dedicated account manager",
        "Priority phone and email support",
        "Custom reporting dashboard",
        "Vendor management system",
        "Bulk operations and automation",
        "Advanced security features",
        "Onboarding and training"
      ],
      limitations: [],
      buttonText: "Contact Sales",
      buttonVariant: "default" as const
    }
  ];

  const yearlyDiscount = billingPeriod === 'yearly' ? 20 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <img src={logoPath} alt="PingJob" className="h-10 w-auto" />
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Jobs
              </Link>
              <Link href="/companies" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Companies
              </Link>
              <Link href="/pricing" className="text-blue-600 px-3 py-2 text-sm font-medium">
                Pricing
              </Link>
              {user && (
                <>
                  <Link href="/network" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Network
                  </Link>
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                    Profile
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center space-x-4">
              {user ? (
                <span className="text-sm text-gray-600">Welcome, {user.firstName || user.email}</span>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/auth">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find the right solution for your career or hiring needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${plan.price * 12 * 0.2} per year
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className="w-full mb-6" 
                  variant={plan.buttonVariant}
                  size="lg"
                  onClick={() => handlePlanSelection(plan.name)}
                >
                  {plan.buttonText}
                </Button>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start">
                            <X className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes, we offer a 14-day free trial for both Recruiter and Enterprise plans. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise clients.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 PingJob. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Building2, Zap } from "lucide-react";
import logo from "@assets/logo_1749581218265.png";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Post up to 3 jobs",
      "Basic job search",
      "Standard support",
      "Basic analytics",
      "Job seeker access"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false,
    userType: "free"
  },
  {
    name: "Recruiter Pro",
    price: "$49",
    period: "month",
    description: "For professional recruiters",
    features: [
      "Unlimited job postings",
      "Advanced candidate search",
      "AI-powered resume matching",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "Bulk job imports",
      "Social media auto-posting"
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    popular: true,
    userType: "recruiter"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations",
    features: [
      "Everything in Recruiter Pro",
      "Multi-location support",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "Advanced security",
      "Custom reporting",
      "API access"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
    userType: "client"
  }
];

export default function Pricing() {
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
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-blue-100">
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="mb-4">
                    {plan.name === "Free" && <Zap className="h-8 w-8 mx-auto text-green-500" />}
                    {plan.name === "Recruiter Pro" && <Users className="h-8 w-8 mx-auto text-blue-500" />}
                    {plan.name === "Enterprise" && <Building2 className="h-8 w-8 mx-auto text-purple-500" />}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold mt-4">
                    {plan.price}
                    {plan.price !== "Custom" && plan.price !== "$0" && (
                      <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {plan.userType === "free" ? (
                    <Link href="/auth?mode=register&plan=free" className="w-full">
                      <Button variant={plan.buttonVariant} className="w-full">
                        {plan.buttonText}
                      </Button>
                    </Link>
                  ) : plan.userType === "recruiter" ? (
                    <Link href="/auth?mode=register&plan=recruiter" className="w-full">
                      <Button variant={plan.buttonVariant} className="w-full">
                        {plan.buttonText}
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/contact-sales" className="w-full">
                      <Button variant={plan.buttonVariant} className="w-full">
                        {plan.buttonText}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our pricing plans
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h3>
                <p className="text-gray-600">No setup fees, no hidden costs. You only pay for your monthly subscription.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards including Visa, MasterCard, and American Express.</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time with no cancellation fees.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">We offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
                <p className="text-gray-600">Absolutely. We use enterprise-grade security and comply with all data protection regulations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of companies already using PingJob to find great talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?mode=register&plan=free">
              <Button size="lg" variant="outline" className="text-black">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact-sales">
              <Button size="lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={logo} alt="PingJob" className="h-6 w-6" />
                <span className="text-lg font-semibold">PingJob</span>
              </div>
              <p className="text-gray-300 text-sm">
                Connect talent with opportunity through our innovative job platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <Link href="/pricing">
                  <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal">
                    Pricing
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <div>
                  <Link href="/about">
                    <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal block">
                      About
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link href="/privacy">
                    <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal block">
                      Privacy
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link href="/terms">
                    <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal block">
                      Terms
                    </Button>
                  </Link>
                </div>
                <div>
                  <Link href="/contact">
                    <Button variant="ghost" className="text-gray-300 hover:text-white p-0 h-auto font-normal block">
                      Contact
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-300">
                <p>support@pingjob.com</p>
                <p>San Francisco, CA</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PingJob. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
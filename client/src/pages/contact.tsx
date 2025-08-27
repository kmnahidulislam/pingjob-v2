import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import logo from "@assets/logo_1749581218265.png";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/">
              <img 
                src={logo} 
                alt="PingJob" 
                className="h-8 w-auto cursor-pointer"
              />
            </Link>
            <nav className="flex space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link href="/contact" className="text-blue-600 font-medium">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Have a question or need support? We're here to help. Reach out to us through any of the methods below.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">pingjobs@gmail.com</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">San Francisco, CA</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Hours</h3>
                  <p className="text-gray-700">
                    Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">How do I post a job?</h4>
                    <p className="text-gray-600 text-sm">Create an employer account and submit your job listing for review.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">How do I apply for jobs?</h4>
                    <p className="text-gray-600 text-sm">Create a profile, upload your resume, and apply directly to employers.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Is PingJob free to use?</h4>
                    <p className="text-gray-600 text-sm">Yes, job seekers can use PingJob completely free of charge.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-600">
                We typically respond to inquiries within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
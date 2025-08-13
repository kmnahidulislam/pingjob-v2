import { Link } from "wouter";
import logo from "@assets/logo_1749581218265.png";

export default function About() {
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
              <Link href="/about" className="text-blue-600 font-medium">About</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About PingJob</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              PingJob is a platform that connects job seekers directly with employers. We focus on showcasing real jobs from verified clients — no recruiters, no middlemen. Our goal is to simplify the job search experience and make applying faster, clearer, and more transparent.
            </p>
            
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 mb-6">
                We believe job searching should be straightforward and honest. That's why we created a platform where job seekers can connect directly with hiring companies, cutting through the noise of traditional job boards.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Makes Us Different</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Direct connections with verified employers</li>
                <li>No recruitment agencies or middlemen</li>
                <li>Transparent job application process</li>
                <li>Focus on authentic job opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
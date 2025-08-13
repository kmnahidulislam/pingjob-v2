import { Link } from "wouter";
import logo from "@assets/logo_1749581218265.png";

export default function Terms() {
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
              <Link href="/terms" className="text-blue-600 font-medium">Terms</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 mb-6">
              By using PingJob, you agree to use the platform for lawful job search and hiring purposes only. You may not post false information, impersonate others, or misuse job listings.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Platform Responsibilities</h2>
            <p className="text-gray-700 mb-6">
              All job listings are provided by third-party employers, and PingJob is not responsible for the hiring process or job outcomes. We reserve the right to remove content or restrict access to protect the integrity of the platform.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Provide accurate and truthful information in your profile and applications</li>
              <li>Respect other users and maintain professional conduct</li>
              <li>Use the platform only for legitimate job search or hiring activities</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement</h2>
            <p className="text-gray-700 mb-6">
              Using PingJob means you accept these terms and agree to our Privacy Policy. We may update these terms from time to time, and continued use of the platform constitutes acceptance of any changes.
            </p>
            
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-600">
                Last updated: June 2025. If you have questions about these terms, please contact us.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
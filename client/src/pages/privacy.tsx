import { Link } from "wouter";
import logo from "@assets/logo_1749581218265.png";

export default function Privacy() {
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
              <Link href="/privacy" className="text-blue-600 font-medium">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              At PingJob, your privacy is important to us. We collect only the minimal personal information necessary to help you find and apply to direct client job opportunities. This may include your name, email address, resume, and job preferences.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Name and email address for account creation</li>
              <li>Resume and professional information you choose to share</li>
              <li>Job preferences and search history</li>
              <li>Basic usage analytics to improve our services</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-6">
              We do not sell your data to third parties. Information may be shared only with employers when you apply for a job or express interest. We take appropriate security measures to protect your data and ensure it's used responsibly.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-6">
              By using PingJob, you agree to our use of cookies and basic analytics to improve our services. You can manage your communication preferences or delete your account at any time.
            </p>
            
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-600">
                Last updated: June 2025. If you have questions about this privacy policy, please contact us.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
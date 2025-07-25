import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";

export default function TestSimpleHome() {
  console.log('TestSimpleHome rendering...');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <img src={logoPath} alt="PingJob" className="h-16 w-auto mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to PingJob</h1>
          <p className="text-xl text-gray-600 mb-8">Professional networking and job search platform</p>
          
          <div className="space-y-4">
            <div>
              <Link href="/auth">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  Get Started
                </button>
              </Link>
            </div>
            
            <div className="text-sm text-gray-500">
              Testing: Home page is loading correctly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Link } from "wouter";
import logo from "@assets/logo_1749581218265.png";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/">
              <img 
                src={logo} 
                alt="PingJob" 
                className="h-8 w-auto mb-4 cursor-pointer filter brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-sm max-w-md">
              Connecting job seekers directly with employers. No recruiters, no middlemen. 
              Find authentic job opportunities with transparent application processes.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4 mt-6">
              <a
                href="https://facebook.com/pingjob"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/pingjobsearch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/pingjob"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Companies
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 PingJob. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="text-gray-400 hover:text-white text-sm">About</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
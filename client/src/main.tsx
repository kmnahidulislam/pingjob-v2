import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import TestComponent from "./test-component";
import "./index.css";
import { initGA } from "./lib/analytics";
import { initializeAdSense } from "./lib/adsense";

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize Google Analytics with error handling
try {
  initGA();
} catch (error) {
  if (import.meta.env.DEV) {
    console.warn('Failed to initialize Google Analytics:', error);
  }
}

// Initialize Google AdSense with error handling
try {
  initializeAdSense();
} catch (error) {
  if (import.meta.env.DEV) {
    console.warn('Failed to initialize Google AdSense:', error);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Temporarily use test component to bypass React plugin issues
root.render(<TestComponent />);

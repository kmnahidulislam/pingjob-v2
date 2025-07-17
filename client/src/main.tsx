import { Component, StrictMode, ReactNode, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import SimpleApp from "./simple-app";
import "./index.css";

// Error boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

// Initialize analytics in production only
if (import.meta.env.PROD) {
  // Initialize Google Analytics
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    import("./lib/analytics").then(({ initGA }) => {
      initGA(import.meta.env.VITE_GA_MEASUREMENT_ID);
    }).catch(error => {
      console.warn('Failed to initialize Google Analytics:', error);
    });
  }
  
  // Initialize Google AdSense
  if (import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID) {
    import("./lib/adsense").then(({ initializeAdSense }) => {
      initializeAdSense(import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID);
    }).catch(error => {
      console.warn('Failed to initialize Google AdSense:', error);
    });
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Try simple app first to bypass React plugin issues
const useSimpleApp = true;

if (useSimpleApp) {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <SimpleApp />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

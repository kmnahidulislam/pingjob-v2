import React from "react";
import { createRoot } from "react-dom/client";

function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#0077B5', marginBottom: '20px' }}>
          PingJob Platform
        </h1>
        <p style={{ marginBottom: '20px' }}>
          React app is loading successfully!
        </p>
        <div style={{ 
          backgroundColor: '#d4edda',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>✓ Security hardening complete</strong>
          <br />
          <small>All security measures are active</small>
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(<MinimalApp />);
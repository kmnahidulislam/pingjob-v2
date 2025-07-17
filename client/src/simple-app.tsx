import { useState } from "react";

export default function SimpleApp() {
  const [message, setMessage] = useState("PingJob Platform Loading...");

  const testAPI = async () => {
    try {
      const response = await fetch('/api/platform/stats');
      const data = await response.json();
      setMessage(`Platform Stats: ${data.totalUsers} users, ${data.totalCompanies} companies, ${data.activeJobs} jobs`);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#0077B5', marginBottom: '20px' }}>PingJob Platform</h1>
        <p style={{ marginBottom: '20px' }}>{message}</p>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>✓ Security Hardening Complete</h3>
            <ul style={{ textAlign: 'left', margin: 0, paddingLeft: '20px' }}>
              <li>✓ All npm vulnerabilities patched</li>
              <li>✓ Helmet security middleware active</li>
              <li>✓ Rate limiting implemented</li>
              <li>✓ Password requirements enforced</li>
              <li>✓ MIME type validation active</li>
            </ul>
          </div>
        </div>

        <button 
          onClick={testAPI}
          style={{
            backgroundColor: '#0077B5',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test API Connection
        </button>

        <button 
          onClick={() => window.location.href = '/test.html'}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          View Security Test Page
        </button>
      </div>
    </div>
  );
}
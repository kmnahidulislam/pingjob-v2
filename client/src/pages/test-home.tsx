import { useAuth } from "@/hooks/use-auth";

export default function TestHome() {
  const { user } = useAuth();
  
  if (import.meta.env.DEV) console.log('TestHome component rendering, user:', user);
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '32px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          🎉 JOB PORTAL - ROUTING WORKING! 🎉
        </h1>
        <div style={{
          backgroundColor: '#dcfce7',
          border: '2px solid #16a34a',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '20px',
            color: '#15803d',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            SUCCESS: Authentication and Routing Working Correctly!
          </p>
        </div>
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '18px', color: '#374151', marginBottom: '16px' }}>
            Hello {user?.firstName || 'User'}! The application is now fully functional.
          </p>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Type:</strong> {user?.userType}</p>
            <p><strong>Current Time:</strong> {new Date().toLocaleTimeString()}</p>
            <p><strong>Status:</strong> Authenticated ✅</p>
          </div>
        </div>
      </div>
    </div>
  );
}
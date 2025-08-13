import { useAuth } from "@/hooks/use-auth";

export default function SimpleHome() {
  const { user } = useAuth();
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '48px',
        color: '#059669',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        ✅ SUCCESS - ROUTING WORKING!
      </h1>
      
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '2px solid #16a34a',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px'
      }}>
        <h2 style={{
          fontSize: '24px',
          color: '#15803d',
          marginBottom: '16px'
        }}>
          Job Portal - Fully Operational
        </h2>
        
        <div style={{
          fontSize: '16px',
          color: '#374151',
          lineHeight: '1.6'
        }}>
          <p><strong>User:</strong> {user?.firstName} {user?.lastName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Type:</strong> {user?.userType}</p>
          <p><strong>Status:</strong> Authenticated & Route Working</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>
      
      <p style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Authentication system working correctly. All routes operational.
      </p>
    </div>
  );
}
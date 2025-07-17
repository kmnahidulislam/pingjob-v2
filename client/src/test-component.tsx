import React from 'react';

export default function TestComponent() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>PingJob Platform</h1>
      <p>Security hardening complete. Testing React component loading...</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.href = '/auth'}>
          Go to Authentication
        </button>
      </div>
    </div>
  );
}
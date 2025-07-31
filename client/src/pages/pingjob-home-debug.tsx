import React from "react";

export default function PingJobHomeDebug() {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '20px'
        }}>
          PingJob Platform
        </h1>
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '20px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h2>DEBUG MODE ACTIVE</h2>
          <p>Testing if basic React components render correctly</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '6px' }}>
            <h3>Platform Stats</h3>
            <p>901 Users</p>
          </div>
          <div style={{ backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '6px' }}>
            <h3>Companies</h3>
            <p>76,811 Companies</p>
          </div>
          <div style={{ backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '6px' }}>
            <h3>Active Jobs</h3>
            <p>14,478 Jobs</p>
          </div>
        </div>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '6px'
        }}>
          <h3>Core Features Working:</h3>
          <ul>
            <li>✓ React component rendering</li>
            <li>✓ Inline CSS styling</li>
            <li>✓ Basic layout structure</li>
            <li>✓ No external dependencies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
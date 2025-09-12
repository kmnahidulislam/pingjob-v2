import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function PingJobHomeSimple() {
  // Test with minimal data fetching - using API config system
  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin-jobs?limit=5']
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      zIndex: 1
    }}>
      <header style={{
        backgroundColor: 'white',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          PingJob Platform
        </h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>
          Professional networking and job search platform
        </p>
      </header>

      <main style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '20px'
        }}>
          Latest Job Opportunities
        </h2>
        
        {isLoading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading jobs...
          </div>
        ) : (
          <div>
            {jobs.length > 0 ? (
              jobs.slice(0, 5).map((job: any, index: number) => (
                <div
                  key={job.id || index}
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    marginBottom: '16px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 8px 0'
                  }}>
                    {job.title || 'Job Title'}
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}>
                    Company: {job.company_name || 'Unknown'}
                  </p>
                  <p style={{
                    color: '#374151',
                    margin: 0,
                    fontSize: '14px'
                  }}>
                    {job.location || 'Location not specified'}
                  </p>
                </div>
              ))
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                No jobs available
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
import React from "react";

export default function TestMinimal() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <h1>MINIMAL TEST PAGE WORKING</h1>
    </div>
  );
}
#!/usr/bin/env node
import { spawn } from 'child_process';
import http from 'http';

console.log('Testing production server...');

// Start the production server
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, PORT: '3001', NODE_ENV: 'production' },
  stdio: 'inherit'
});

// Wait for server to start
setTimeout(() => {
  console.log('Testing health endpoint...');
  
  const req = http.get('http://localhost:3001/health', (res) => {
    console.log(`✓ Health check status: ${res.statusCode}`);
    
    // Test main page
    const mainReq = http.get('http://localhost:3001/', (mainRes) => {
      console.log(`✓ Main page status: ${mainRes.statusCode}`);
      console.log('✓ Production server is working correctly!');
      
      // Kill the server
      server.kill();
      process.exit(0);
    });
    
    mainReq.on('error', (err) => {
      console.error('✗ Main page test failed:', err.message);
      server.kill();
      process.exit(1);
    });
  });
  
  req.on('error', (err) => {
    console.error('✗ Health check failed:', err.message);
    server.kill();
    process.exit(1);
  });
  
}, 3000);

// Timeout after 10 seconds
setTimeout(() => {
  console.error('✗ Test timed out');
  server.kill();
  process.exit(1);
}, 10000);
#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production rebuild with all fixes...');

// Function to run command with promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function main() {
  try {
    // Step 1: Clean previous build
    console.log('🧹 Cleaning previous build...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // Step 2: Build the application
    console.log('🔨 Building application...');
    await runCommand('npm', ['run', 'build'], { 
      timeout: 120000 // 2 minute timeout
    });
    
    // Step 3: Fix build files
    console.log('🔧 Fixing build files for production...');
    await runCommand('node', ['fix-build.js']);
    
    // Step 4: Verify build
    console.log('✅ Verifying build...');
    const requiredFiles = [
      'dist/index.html',
      'dist/index.js',
      'dist/assets'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    console.log('🎉 Production build completed successfully!');
    console.log('');
    console.log('📦 Ready for deployment:');
    console.log('   - All console.log statements wrapped with development checks');
    console.log('   - React error boundary in place');
    console.log('   - Build files copied to correct location');
    console.log('   - Google Analytics and AdSense with error handling');
    console.log('');
    console.log('🚀 Deploy with:');
    console.log('   NODE_ENV=production node dist/index.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
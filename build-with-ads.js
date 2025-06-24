#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building application with ads.txt support...');

try {
  // Run the standard build process
  console.log('Running vite build...');
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Ensure dist/public directory exists
  const publicDir = 'dist/public';
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Copy ads.txt to the public directory
  if (fs.existsSync('ads.txt')) {
    fs.copyFileSync('ads.txt', path.join(publicDir, 'ads.txt'));
    console.log('✓ ads.txt copied to dist/public/');
  } else {
    console.warn('Warning: ads.txt not found in root directory');
  }
  
  // Also copy ads.txt to root dist directory for direct serving
  fs.copyFileSync('ads.txt', 'dist/ads.txt');
  console.log('✓ ads.txt copied to dist/');
  
  console.log('Build completed successfully with ads.txt support!');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
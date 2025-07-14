#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Fix for production deployment issue:
 * The vite config builds to dist/public but the server looks for files in dist/
 * This script copies the built files to the correct location for production
 */

const sourceDir = path.join(process.cwd(), 'dist', 'public');
const targetDir = path.join(process.cwd(), 'dist');

try {
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error('Source directory not found:', sourceDir);
    console.error('Please run "npm run build" first');
    process.exit(1);
  }

  // Read all files in source directory
  const files = fs.readdirSync(sourceDir);
  
  // Copy each file to the target directory
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // Skip if file already exists in target (avoid overwriting server files)
    if (fs.existsSync(targetPath) && file !== 'index.html') {
      console.log(`Skipping ${file} (already exists)`);
      return;
    }
    
    // Copy file or directory
    if (fs.statSync(sourcePath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(sourcePath, targetPath, { recursive: true });
      console.log(`Copied directory: ${file}`);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied file: ${file}`);
    }
  });

  console.log('✓ Production build files copied successfully');
  console.log('✓ Ready for deployment');
  
} catch (error) {
  console.error('Error copying build files:', error);
  process.exit(1);
}
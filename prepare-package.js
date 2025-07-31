#!/usr/bin/env node

/**
 * Package Preparation Script
 * Creates a clean distribution package for sharing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files and directories to include in the package
const includeFiles = [
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'DEPLOYMENT.md',
  'package.json',
  'package-lock.json',
  'index.html',
  'src/',
  'public/',
  '.gitignore'
];

// Files and directories to exclude
const excludePatterns = [
  'node_modules',
  'dist',
  '.git',
  '.vscode',
  '.idea',
  '*.log',
  '.env*',
  'prepare-package.js',
  'cold-calling-directory-v*.zip'
];

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldExclude(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function createPackage() {
  const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageInfo.version;
  const packageName = `cold-calling-directory-v${version}`;
  const packageDir = path.join(__dirname, packageName);

  console.log(`📦 Creating package: ${packageName}`);

  // Clean up existing package directory
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }

  // Create package directory
  fs.mkdirSync(packageDir, { recursive: true });

  // Copy files and directories
  for (const item of includeFiles) {
    const srcPath = path.join(__dirname, item);
    const destPath = path.join(packageDir, item);

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  Warning: ${item} not found, skipping...`);
      continue;
    }

    const stats = fs.statSync(srcPath);
    
    if (stats.isDirectory()) {
      console.log(`📁 Copying directory: ${item}`);
      copyDirectorySync(srcPath, destPath);
    } else {
      console.log(`📄 Copying file: ${item}`);
      copyFileSync(srcPath, destPath);
    }
  }

  // Create a quick start script
  const quickStartScript = `#!/bin/bash

echo "🚀 Cold Calling Directory - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then open your browser to: http://localhost:5173"
echo ""
echo "📖 For more information, see README.md"
`;

  fs.writeFileSync(path.join(packageDir, 'quick-start.sh'), quickStartScript);
  fs.chmodSync(path.join(packageDir, 'quick-start.sh'), '755');

  // Create Windows batch file
  const quickStartBat = `@echo off
echo 🚀 Cold Calling Directory - Quick Start
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🎉 Setup complete!
echo.
echo To start the application:
echo   npm run dev
echo.
echo Then open your browser to: http://localhost:5173
echo.
echo 📖 For more information, see README.md
echo.
pause
`;

  fs.writeFileSync(path.join(packageDir, 'quick-start.bat'), quickStartBat);

  console.log('');
  console.log('✅ Package created successfully!');
  console.log(`📁 Location: ${packageDir}`);
  console.log('');
  console.log('📋 Package contents:');
  console.log('   📄 README.md - Complete documentation');
  console.log('   📄 LICENSE - MIT license');
  console.log('   📄 CHANGELOG.md - Version history');
  console.log('   📄 DEPLOYMENT.md - Deployment guide');
  console.log('   📄 package.json - Project configuration');
  console.log('   📁 src/ - Source code');
  console.log('   📁 public/ - Static assets');
  console.log('   🚀 quick-start.sh - Linux/Mac setup script');
  console.log('   🚀 quick-start.bat - Windows setup script');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Zip the package directory');
  console.log('   2. Share with others');
  console.log('   3. Recipients can run quick-start script for easy setup');
  console.log('');

  return packageDir;
}

// Run the package creation
try {
  const packageDir = createPackage();
  console.log(`🎉 Package ready for distribution: ${path.basename(packageDir)}`);
} catch (error) {
  console.error('❌ Error creating package:', error.message);
  process.exit(1);
}

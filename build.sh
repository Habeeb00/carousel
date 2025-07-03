#!/bin/bash

# Instagram Carousel Creator - Production Build Script
# This script prepares the plugin for publishing to the Figma Plugin Store

echo "🚀 Building Instagram Carousel Creator Plugin for production..."

# Ensure dependencies are installed
echo "📦 Checking dependencies..."
npm install

# Run linting
echo "🔍 Running linter..."
npm run lint

# Build the plugin
echo "🛠️ Building plugin..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  # Create a distribution folder
  echo "📁 Creating distribution package..."
  mkdir -p dist
  
  # Copy necessary files to dist folder
  cp manifest.json dist/
  cp code.js dist/
  cp ui.html dist/
  cp README.md dist/
  
  echo "🎉 Plugin is ready for production!"
  echo "📋 Files prepared in the 'dist' folder"
else
  echo "❌ Build failed. Please fix the errors and try again."
  exit 1
fi 
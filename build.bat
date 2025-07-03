@echo off
echo 🚀 Building Instagram Carousel Creator Plugin for production...

rem Ensure dependencies are installed
echo 📦 Checking dependencies...
call npm install

rem Run linting
echo 🔍 Running linter...
call npm run lint

rem Build the plugin
echo 🛠️ Building plugin...
call npm run build

rem Check if build was successful
if %ERRORLEVEL% EQU 0 (
  echo ✅ Build successful!
  
  rem Create a distribution folder
  echo 📁 Creating distribution package...
  if not exist dist mkdir dist
  
  rem Copy necessary files to dist folder
  copy manifest.json dist\
  copy code.js dist\
  copy ui.html dist\
  copy README.md dist\
  
  echo 🎉 Plugin is ready for production!
  echo 📋 Files prepared in the 'dist' folder
) else (
  echo ❌ Build failed. Please fix the errors and try again.
  exit /b 1
) 
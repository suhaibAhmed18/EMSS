@echo off
REM Fix "No stores connected" error
REM This script helps create a test store for development

echo ========================================
echo Fix "No stores connected" Error
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local file not found
    echo Please create .env.local with your Supabase credentials
    pause
    exit /b 1
)

echo Enter your user email address:
set /p USER_EMAIL=Email: 

if "%USER_EMAIL%"=="" (
    echo ERROR: Email cannot be empty
    pause
    exit /b 1
)

echo.
echo Creating test store for: %USER_EMAIL%
echo.

node scripts/create-test-store.js %USER_EMAIL%

echo.
echo ========================================
pause

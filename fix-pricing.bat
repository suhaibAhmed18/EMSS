@echo off
echo ========================================
echo   Pricing Consistency Fix
echo ========================================
echo.
echo This script will help you fix pricing inconsistencies.
echo.
echo STEP 1: Database Migration
echo --------------------------
echo Please run this SQL in your Supabase SQL Editor:
echo   scripts\ensure-subscription-plans.sql
echo.
echo This will:
echo   - Delete old subscription plans
echo   - Insert consistent plans (Starter $10, Professional $20, Enterprise $30)
echo   - Verify the data
echo.
pause
echo.
echo STEP 2: Verify Changes
echo ----------------------
echo After running the SQL, test these pages:
echo   1. http://localhost:3000/pricing
echo   2. http://localhost:3000/settings (Pricing and usage tab)
echo.
echo Both should show:
echo   - Starter: $10/month
echo   - Professional: $20/month
echo   - Enterprise: $30/month
echo.
echo STEP 3: Test Upgrade Flow
echo -------------------------
echo   1. Go to Settings ^> Pricing and usage
echo   2. Click "Upgrade Plan" button
echo   3. Verify modal opens without errors
echo   4. Check browser console for errors
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo All code changes are already applied.
echo Just run the SQL migration and test!
echo.
pause

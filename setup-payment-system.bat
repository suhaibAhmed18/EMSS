@echo off
echo ========================================
echo Payment System Setup
echo ========================================
echo.

echo Step 1: Checking if database migration is needed...
echo.
echo Please run this SQL in your Supabase SQL Editor:
echo.
type scripts\add-subscription-fields.sql
echo.
echo ========================================
echo.

echo Step 2: Environment Variables Check
echo.
echo Please ensure these are set in .env.local:
echo.
echo [Stripe - Required for payments]
echo STRIPE_PUBLISHABLE_KEY=pk_test_...
echo STRIPE_SECRET_KEY=sk_test_...
echo STRIPE_WEBHOOK_SECRET=whsec_...
echo.
echo [Telnyx - Required for SMS]
echo TELNYX_API_KEY=KEY...
echo TELNYX_CONNECTION_ID=...
echo TELNYX_MESSAGING_PROFILE_ID=...
echo.
echo [Email - Already configured]
echo RESEND_API_KEY=re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB
echo.
echo ========================================
echo.

echo Step 3: Testing the Flow
echo.
echo 1. Start dev server: npm run dev
echo 2. Visit: http://localhost:3000/pricing
echo 3. Select a plan
echo 4. Complete registration
echo 5. Enter test card: 4242 4242 4242 4242
echo 6. Check console for verification link
echo 7. Login and see your phone number
echo.
echo ========================================
echo.

echo For detailed instructions, see:
echo - QUICK_START_PRICING_FLOW.md
echo - PRICING_AND_PAYMENT_SETUP.md
echo - PAYMENT_FLOW_DIAGRAM.md
echo.

pause

# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Update Environment Variables

Edit `.env.production` and update:

- `NEXT_PUBLIC_APP_URL` - Your production domain (e.g., https://yourdomain.com)
- `NEXTAUTH_URL` - Same as above
- `SHOPIFY_CLIENT_ID` - Your Shopify app client ID
- `SHOPIFY_CLIENT_SECRET` - Your Shopify app client secret
- `SHOPIFY_WEBHOOK_SECRET` - Your webhook secret from Shopify
- `RESEND_API_KEY` - Your Resend API key (if using email)
- `TELNYX_API_KEY` - Your Telnyx API key (if using SMS)
- `STRIPE_*` - Your Stripe keys (if using billing)

### 2. Update Shopify App Configuration

In Shopify Partners Dashboard:
1. Go to your app settings
2. Update **App URL** to: `https://yourdomain.com`
3. Update **Allowed redirection URL** to: `https://yourdomain.com/api/auth/shopify/callback`
4. Save changes

### 3. Database Setup

Your Supabase database is already configured. No changes needed.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add all variables from `.env.production`
   - Redeploy

### Option 2: Docker (Self-Hosted)

1. **Build Docker image**:
   ```bash
   docker build -t marketing-platform .
   ```

2. **Run container**:
   ```bash
   docker run -p 3000:3000 --env-file .env.production marketing-platform
   ```

### Option 3: Traditional VPS (DigitalOcean, AWS, etc.)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Copy files to server**:
   ```bash
   # Copy .next, public, package.json, node_modules
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

4. **Use PM2 for process management**:
   ```bash
   npm i -g pm2
   pm2 start npm --name "marketing-platform" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment

### 1. Test OAuth Flow
- Visit: `https://yourdomain.com/stores/connect`
- Try connecting a Shopify store
- Verify OAuth redirect works

### 2. Test Core Features
- User registration/login
- Store connection
- Campaign creation
- Customer import

### 3. Monitor Logs
- Check application logs for errors
- Monitor Supabase logs
- Set up error tracking (Sentry, etc.)

### 4. SSL Certificate
- Ensure HTTPS is enabled
- Use Let's Encrypt for free SSL
- Shopify requires HTTPS for OAuth

## Environment-Specific Notes

### Vercel
- Automatically handles SSL
- Auto-deploys on git push
- Built-in analytics
- Serverless functions

### Docker
- Need reverse proxy (nginx) for SSL
- Use docker-compose for easier management
- Consider using Traefik for automatic SSL

### VPS
- Install nginx as reverse proxy
- Use certbot for SSL certificates
- Set up firewall rules
- Configure domain DNS

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] API keys not exposed in client code
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified

## Troubleshooting

### OAuth Errors
- Verify redirect URI matches exactly in Shopify
- Check HTTPS is enabled
- Ensure domain is accessible

### Database Connection Issues
- Verify Supabase credentials
- Check network connectivity
- Review Supabase logs

### Build Errors
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check Node.js version (18+)

## Support

For issues, check:
1. Application logs
2. Supabase dashboard
3. Shopify Partner dashboard
4. Browser console

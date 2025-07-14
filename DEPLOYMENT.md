# Production Deployment Guide for PingJob

## URGENT: Fix White Screen at pingjob.com

### Critical Issue
The white screen at pingjob.com is caused by production build issues and console.log errors.

### Immediate Fix Required

**On your cloud platform deployment (where pingjob.com is hosted):**

1. **Stop the current server**

2. **Rebuild with all fixes:**
   ```bash
   npm run build
   node fix-build.js
   ```

3. **Start production server:**
   ```bash
   NODE_ENV=production node dist/index.js
   ```

### Why This Fixes the White Screen
- ✅ All console.log statements now wrapped with development checks
- ✅ Build files will be copied to correct directory
- ✅ React error boundary catches any runtime errors
- ✅ Google Analytics/AdSense won't crash in production

## Environment Variables Required

### Essential Variables
```bash
# Database (Required)
DATABASE_URL=your_neon_postgresql_url

# Session Security (Required)
SESSION_SECRET=your_random_session_secret_here

# Server Port (Optional - defaults to 5000)
PORT=5000
```

### Optional Variables
```bash
# Google Analytics (Optional)
VITE_GA_MEASUREMENT_ID=your_google_analytics_id

# Google AdSense (Optional)
VITE_GOOGLE_ADSENSE_CLIENT_ID=your_adsense_client_id

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (Optional - logs warnings if missing)
STRIPE_SECRET_KEY=your_stripe_secret_key

# SendGrid Email (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key

# Facebook API (Optional)
FACEBOOK_ACCESS_TOKEN=your_facebook_token
```

## Cloud Platform Instructions

### For Deployment Platforms (Heroku, Railway, Render, etc.)

1. **Build Command:**
   ```bash
   npm run build && node fix-build.js
   ```

2. **Start Command:**
   ```bash
   NODE_ENV=production node dist/index.js
   ```

3. **Port Configuration:**
   - The app automatically uses `process.env.PORT` or defaults to 5000
   - Health check endpoint: `/health` (returns "OK")

### Why the fix-build.js Script is Needed

The application has a specific production build issue:
- Vite builds files to `dist/public/`
- The production server expects files in `dist/`
- The `fix-build.js` script copies built files to the correct location

**This script MUST be run after every build for production deployment.**

## Health Check

The application includes a `/health` endpoint that returns "OK" for cloud platform monitoring.

## Troubleshooting

### Blank Screen Issues (SOLVED)
- **Cause:** Build files in wrong directory
- **Solution:** Always run `node fix-build.js` after building

### Missing Environment Variables
- The app gracefully handles missing optional environment variables
- Only `DATABASE_URL` is required for basic functionality

### Console Errors in Production
- All debug logging is disabled in production (NODE_ENV=production)
- Error boundary catches runtime errors and shows user-friendly messages

## Deployment Checklist

- [ ] Run `npm run build`
- [ ] Run `node fix-build.js`
- [ ] Set `DATABASE_URL` environment variable
- [ ] Set `SESSION_SECRET` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Test health check endpoint: `/health`
- [ ] Verify application loads without blank screen

## Notes

- The application is designed to be cloud-platform agnostic
- All production issues causing blank screens have been resolved
- The app works with minimal environment variables for basic functionality
- Optional features (Analytics, OAuth, Stripe) fail gracefully if not configured
# Facebook Posting Fix - Token Expired

## Problem Identified
✅ **Root Cause Found**: Your Facebook access token has expired ("The session is invalid because the user logged out")

## Current Status
- ✅ Social media posting code is working correctly
- ✅ Facebook Page ID is correct: 786417794545751  
- ❌ Facebook access token is expired and needs refresh
- ✅ Posting triggers are in place (jobs automatically post when created/edited)

## SOLUTION: Get New Facebook Token

### Option 1: Quick Fix (Short-term token - 1-2 hours)
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your Facebook app
3. Click "Get Token" → "Page Access Token"
4. Select your PingJob page
5. Copy the new token
6. Update your `FACEBOOK_ACCESS_TOKEN` secret in Replit

### Option 2: Long-lived Token (60 days) - RECOMMENDED
1. Get a short-term token from Step 1 above
2. Exchange it for a long-lived token using this URL:
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
   ```
3. Use the long-lived token as your `FACEBOOK_ACCESS_TOKEN`

### Required Permissions
Make sure your token has these permissions:
- ✅ `pages_manage_posts` (to create posts)
- ✅ `pages_read_engagement` (to read post data)  
- ✅ `pages_show_list` (to access page info)

## Testing After Fix
Once you update the token, the system will automatically:
1. ✅ Post new jobs to Facebook when created
2. ✅ Post job updates to Facebook when edited
3. ✅ Log success/failure results in the database

## Verification Steps
1. Update your Facebook token
2. Create or edit a test job
3. Check your Facebook page - the job should appear
4. Check server logs for success confirmation

## Why This Happened
Facebook tokens expire for security. This is normal behavior. You'll need to refresh the token periodically (every 60 days for long-lived tokens).

---
**Next Steps**: Update your `FACEBOOK_ACCESS_TOKEN` secret with a fresh token, and jobs will immediately start posting to Facebook again!
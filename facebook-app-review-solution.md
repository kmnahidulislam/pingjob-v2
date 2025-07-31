# Facebook App Review Required for Posting Permissions

## Current Issue
Your Facebook tokens are failing because your app needs **Facebook's approval** for posting permissions. This is a Facebook security requirement for production apps.

## Two Solutions Available:

### Solution 1: Facebook App Review (Recommended for Production)

**Steps:**
1. Go to your Facebook App Dashboard: https://developers.facebook.com/apps/1377200590045125
2. Navigate to "App Review" → "Permissions and Features"
3. Request these permissions:
   - `pages_manage_posts` 
   - `pages_read_engagement`
4. Provide business justification:
   ```
   PingJob is a professional networking platform that helps companies post job opportunities 
   to Facebook to reach qualified candidates. We need pages_manage_posts permission to 
   automatically share job postings from our platform to company Facebook pages, helping 
   employers reach a wider audience of potential applicants.
   ```
5. Submit for review (typically 2-7 business days)
6. Once approved, your existing tokens will work for posting

### Solution 2: Development Mode Workaround (Immediate Fix)

**Steps:**
1. Add yourself as a developer/tester in your Facebook app
2. Use Facebook's test pages instead of production pages
3. This bypasses the review requirement for testing

## Current Token Analysis
Your user token has these permissions:
- ✅ pages_show_list (approved)
- ❌ pages_manage_posts (requires app review)
- ❌ pages_read_engagement (requires app review)

## Recommendation
Submit for Facebook App Review as it's the proper long-term solution. The review process is straightforward for legitimate business use cases like job posting automation.

## Temporary Alternative
Until Facebook approval, you can:
1. Manually post to Facebook when needed
2. Use other social platforms (Twitter/Instagram) that may have simpler approval processes
3. Set up webhook notifications when jobs are posted so you can manually share them
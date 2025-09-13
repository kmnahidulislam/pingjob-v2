# Fix Google Play Console AD_ID Error

## The Problem
You're getting this error because your Play Console app declaration says you use Advertising ID, but your app manifest doesn't include the required permission.

## The Solution
You have two options:

### Option 1: Update Play Console Declaration (RECOMMENDED)
If your app doesn't actually use advertising/analytics that require Advertising ID:

1. Go to Google Play Console
2. Navigate to your app → Policy → App content  
3. Find "Advertising ID" section
4. Update declaration to "No, my app does not use Advertising ID"
5. Save changes

### Option 2: Add Permission (if you use advertising)
If your app actually uses advertising/analytics that require Advertising ID:

1. Add this permission back to AndroidManifest.xml:
   ```xml
   <uses-permission android:name="com.google.android.gms.permission.AD_ID" />
   ```

## Recommended Action
Since PingJob doesn't appear to use advertising SDKs, use **Option 1** to update the Play Console declaration.

This will resolve the error permanently without requiring code changes.
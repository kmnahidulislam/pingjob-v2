# Codemagic Setup Guide for PingJob Android Build

## Step-by-Step Instructions

### 1. Create Codemagic Account
- Go to https://codemagic.io
- Sign up with your Google/GitHub account (free)
- No credit card required for basic builds

### 2. Add Your PingJob Project
- Click "Add application"
- Connect your repository source:
  - **GitHub**: If you have this code in GitHub
  - **GitLab**: If using GitLab
  - **Bitbucket**: If using Bitbucket
  - **Upload ZIP**: If you need to upload the project files

### 3. Configure Project Settings
- **Project type**: Select "Capacitor"
- **Platform**: Select "Android"
- **Build configuration**: Choose "Release"

### 4. Build Configuration
Codemagic will detect your Capacitor project automatically. Ensure these settings:

```yaml
# The build will automatically run:
npm install
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

### 5. Environment Variables (Optional)
If needed, add these in Codemagic dashboard:
- `ANDROID_HOME`: (automatically configured)
- Any API keys from your .env file

### 6. Start Build
- Click "Start new build"
- Build typically takes 5-10 minutes
- Monitor progress in real-time

### 7. Download Your AAB File
Once build completes:
- Click on the build result
- Download `app-release.aab` file
- This is what you'll upload to Google Play Console

## Your PingJob Configuration

The build will create an AAB with:
- **Package name**: `com.pingjob`
- **Version code**: `5`
- **Version name**: `2.0.0`
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 24 (Android 7.0)

## After Download

1. Go to Google Play Console
2. Select your existing PingJob app
3. Navigate to Release → Production
4. Create new release
5. Upload the `app-release.aab` file
6. Use store description from `STORE-LISTING-UPDATE.md`
7. Submit for review

## Troubleshooting

**Build fails?**
- Check that all files are included in your repository
- Ensure `package.json` and `capacitor.config.ts` are present
- Contact Codemagic support (very responsive)

**Wrong package name?**
- The build uses `com.pingjob` as configured
- This should match your existing app for replacement

**Need different configuration?**
- Edit `capacitor.config.ts` or `android/app/build.gradle` before building
- Push changes and rebuild

## Free Tier Limits

Codemagic free tier includes:
- 500 build minutes/month
- Sufficient for multiple builds
- No time limit on first build

Your PingJob build should complete successfully and produce the AAB file ready for Google Play Console upload.
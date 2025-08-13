# Android App Signing for Google Play Store

## Create Release Keystore

```bash
# Navigate to android directory
cd android

# Generate release keystore (one-time setup)
keytool -genkey -v -keystore release-key.keystore -alias pingjob -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (save this securely!)
# - Key password (save this securely!)
# - Your name and organization details
```

## Configure Signing in build.gradle

Add to `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'pingjob'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Build Release Bundle

```bash
# Clean previous builds
./gradlew clean

# Build signed release bundle for Play Store
./gradlew bundleRelease

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab
```

## Security Best Practices

1. **Store keystore securely** - Never commit to version control
2. **Backup keystore** - Store in multiple secure locations
3. **Document passwords** - Save in password manager
4. **Use same keystore** - For all future app updates

## Upload to Google Play Console

1. Go to Google Play Console
2. Create new app or select existing
3. Navigate to "Release" → "Production"
4. Upload the `app-release.aab` file
5. Complete store listing and publish

## Important Notes

- **Lost keystore = Cannot update app** - Google cannot help recover
- Use environment variables for passwords in CI/CD
- Test signed build before uploading to store
- Keep keystore for lifetime of app (25+ years validity)
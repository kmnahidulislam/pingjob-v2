# PingJob Android App Setup Guide

## Prerequisites for Android Development

### Required Software
1. **Java 17** - ✅ Installing automatically
2. **Android Studio** - Download from https://developer.android.com/studio
3. **Android SDK** - Installed with Android Studio

### Environment Setup
After installing Java 17, set up your environment:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Android App Configuration

### App Details
- **App Name**: PingJob
- **Package**: com.pingjob.app
- **Target SDK**: Android 13 (API 33)
- **Min SDK**: Android 7.0 (API 24)

### Theme & Branding
- **Primary Color**: #0077B5 (LinkedIn Blue)
- **Status Bar**: #004182 (Dark Blue)
- **Splash Screen**: LinkedIn blue background with app icon
- **App Icon**: Will be generated from PingJob logo

### Features Enabled
- Internet permissions for API calls
- File provider for document/image uploads
- Hardware back button support
- Status bar customization
- Splash screen with 2-second duration

## Build Commands

### Development Build
```bash
# Sync web assets to Android
npm run build && npx cap sync android

# Open Android Studio
npx cap open android

# Or build directly
cd android && ./gradlew assembleDebug
```

### Release Build
```bash
# Build release APK
cd android && ./gradlew assembleRelease

# Build App Bundle for Play Store
cd android && ./gradlew bundleRelease
```

## Testing Options

### 1. Android Emulator
- Create virtual device in Android Studio
- API Level 24+ recommended
- Google Play enabled device for testing

### 2. Physical Device
- Enable Developer Options on Android device
- Enable USB Debugging
- Connect via USB cable
- Device will appear in Android Studio

### 3. Wireless Testing
- Enable Wireless Debugging (Android 11+)
- Connect over WiFi for testing

## Next Steps After Java Installation

1. **Install Android Studio**
2. **Set up Android SDK**
3. **Create virtual device or connect physical device**
4. **Build and test the app**

The Android app is configured and ready for development once Java and Android Studio are installed!
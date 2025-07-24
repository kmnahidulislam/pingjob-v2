# PingJob Mobile Apps - Quick Start Guide

## 🚀 Run Android App
```bash
# Build and open Android Studio
npm run build && npx cap sync android && npx cap open android

# Or run directly on connected device/emulator
npm run build && npx cap run android
```

## 🍎 Run iOS App (macOS only)
```bash
# Build and open Xcode
npm run build && npx cap sync ios && npx cap open ios

# Or run directly on connected device/simulator
npm run build && npx cap run ios
```

## 📱 Mobile Features
- Native status bar with LinkedIn blue theme
- Splash screen with PingJob branding
- Touch-optimized interface (44px minimum buttons)
- Keyboard-aware layouts
- Hardware back button support (Android)
- Safe area support for modern devices

## 🛠 Development Tips
1. Always run `npm run build` before syncing to mobile platforms
2. Use `npx cap sync` to update mobile apps after code changes
3. Test on real devices for best performance assessment
4. Android requires Android Studio, iOS requires Xcode (macOS only)

## 📋 App Configuration
- **App ID**: com.pingjob.app
- **App Name**: PingJob
- **Platforms**: Android 7.0+, iOS 12.0+
- **Features**: All web features + native mobile enhancements
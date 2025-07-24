#!/bin/bash

# Script to update PingJob app configuration for existing app replacement
# Usage: ./update-package-configuration.sh com.yourcompany.existingapp "Your App Name" 5

if [ $# -ne 3 ]; then
    echo "Usage: $0 <package_name> <app_name> <current_version_code>"
    echo "Example: $0 com.yourcompany.existingapp 'Your App Name' 5"
    exit 1
fi

PACKAGE_NAME=$1
APP_NAME=$2
CURRENT_VERSION=$3
NEW_VERSION=$((CURRENT_VERSION + 1))

echo "🔧 Updating PingJob configuration for existing app replacement..."
echo "Package Name: $PACKAGE_NAME"
echo "App Name: $APP_NAME"
echo "New Version Code: $NEW_VERSION"
echo ""

# Update capacitor.config.ts
echo "📱 Updating Capacitor configuration..."
sed -i.bak "s/appId: ['\"]com\.pingjob\.app['\"]/appId: '$PACKAGE_NAME'/" capacitor.config.ts
sed -i.bak "s/appName: ['\"]PingJob['\"]/appName: '$APP_NAME'/" capacitor.config.ts

# Update Android build.gradle
echo "🔨 Updating Android build configuration..."
sed -i.bak "s/applicationId ['\"]com\.pingjob\.app['\"]/applicationId '$PACKAGE_NAME'/" android/app/build.gradle
sed -i.bak "s/versionCode [0-9]*/versionCode $NEW_VERSION/" android/app/build.gradle

# Update AndroidManifest.xml
echo "📋 Updating Android manifest..."
sed -i.bak "s/package=['\"][^'\"]*['\"]/package='$PACKAGE_NAME'/" android/app/src/main/AndroidManifest.xml

# Update strings.xml
echo "📝 Updating app strings..."
sed -i.bak "s/<string name=['\"]app_name['\"]>[^<]*<\/string>/<string name='app_name'>$APP_NAME<\/string>/" android/app/src/main/res/values/strings.xml
sed -i.bak "s/<string name=['\"]package_name['\"]>[^<]*<\/string>/<string name='package_name'>$PACKAGE_NAME<\/string>/" android/app/src/main/res/values/strings.xml

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: npm run build && npx cap sync android"
echo "2. Build release: cd android && ./gradlew bundleRelease"
echo "3. Upload app-release.aab to your existing app in Google Play Console"
echo ""
echo "🔍 Files updated:"
echo "- capacitor.config.ts"
echo "- android/app/build.gradle" 
echo "- android/app/src/main/AndroidManifest.xml"
echo "- android/app/src/main/res/values/strings.xml"
echo ""
echo "📂 Backup files created with .bak extension"
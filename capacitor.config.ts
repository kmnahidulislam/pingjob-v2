import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pingjob',
  appName: 'PingJob',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://www.pingjob.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      showSpinner: false,
      useDialog: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    }
  }
};

export default config;
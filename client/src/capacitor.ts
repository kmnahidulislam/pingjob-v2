import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Browser } from '@capacitor/browser';

export class CapacitorService {
  static async initialize() {
    if (Capacitor.isNativePlatform()) {
      // Configure status bar to be visible and not overlapping content
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1e40af' });
      await StatusBar.show(); // Ensure status bar is visible
      await StatusBar.setOverlaysWebView({ overlay: false }); // Don't overlay the WebView

      // Hide splash screen
      await SplashScreen.hide();

      // Configure keyboard
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-open');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle OAuth callback URLs
      App.addListener('appUrlOpen', async (event) => {
        console.log('🔐 App URL opened:', event.url);
        
        if (event.url.includes('auth-callback')) {
          // Close any open browser
          await Browser.close();
          
          // Extract token from URL
          const url = new URL(event.url);
          const token = url.searchParams.get('token');
          const error = url.searchParams.get('error');
          
          if (token) {
            try {
              // Exchange token for session in WebView
              const response = await fetch('/api/auth/mobile-complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token }),
                credentials: 'include' // Important for session cookies
              });
              
              if (response.ok) {
                console.log('🔐 Mobile session established successfully');
                window.location.href = '/dashboard';
              } else {
                const errorData = await response.json();
                console.error('🔐 Mobile session exchange failed:', errorData);
                window.location.href = '/auth?error=session_failed';
              }
            } catch (error) {
              console.error('🔐 Mobile session exchange error:', error);
              window.location.href = '/auth?error=network_error';
            }
          } else {
            console.error('OAuth error:', error);
            window.location.href = '/auth?error=' + encodeURIComponent(error || 'Authentication failed');
          }
        }
      });

      // Handle back button (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }

  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  static async exitApp() {
    if (Capacitor.isNativePlatform()) {
      await App.exitApp();
    }
  }
}
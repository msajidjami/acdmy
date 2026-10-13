import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  /* ✅ App identity — ilmora786 */
  appId: 'com.ilmora786.app',
  appName: 'ilmora786',
  webDir: 'public',

  /* ✅ Live website URL — Capacitor WebView یہیں سے load کرے گا */
  server: {
    url: 'https://www.quranandislamic.com',
    cleartext: false,
    androidScheme: 'https',
  },

  /* ✅ Notifications & Splash */
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',       // ⚠️ نیچے نوٹ دیکھیں
      iconColor: '#059669',
      sound: 'ringtone.wav',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#059669',      // ✅ emerald (brand color)
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },

  /* ✅ Android specific */
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // ✅ release کے لیے بند
  },

  /* ✅ iOS specific */
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#059669',
  },
};

export default config;
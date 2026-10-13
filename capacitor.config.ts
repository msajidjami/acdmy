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

  /* ✅ Push & Local Notifications — کلاس ring کے لیے */
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0ea5e9',
      sound: 'ringtone.wav',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
  },

  /* ✅ Android specific */
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // صرف development میں — release سے پہلے ہٹا دیں
  },

  /* ✅ iOS specific */
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
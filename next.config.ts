import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* ✅ Baileys اور اس کی dependencies کو bundle سے باہر رکھیں
     (یہ @eshaz/web-worker کی dynamic import error حل کرتا ہے) */
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    '@eshaz/web-worker',
    '@wasm-audio-decoders/common',
    '@wasm-audio-decoders/ogg-vorbis',
    'audio-decode',
    'link-preview-js',
    'jimp',
    'sharp',
    'pino',
    'mongoose',
    'mongodb',
    'firebase-admin',
    'web-push',
    'qrcode-terminal',
  ],

  experimental: {
    /* ✅ بڑی pages کے لیے (آپ کی موجودہ setting) */
    largePageDataBytes: 20 * 1000 * 1000, // 20 MB
  },
};

export default nextConfig;
export const APP_CONFIG = {
  env: process.env.EXPO_PUBLIC_ENV || 'local',
  iosAppId: process.env.EXPO_PUBLIC_IOS_APP_ID,
  /** The iOS bundle id the iTunes lookup answers for; the committed value is a placeholder */
  iosBundleId: process.env.EXPO_PUBLIC_IOS_BUNDLE_ID || 'com.example.athan',
  /** Dev-only force of the What's New modal on cold launch (EXPO_PUBLIC_WHATS_NEW_PREVIEW=1) */
  whatsNewPreview: process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1',
};

// Environment helpers
export const isProd = () => APP_CONFIG.env === 'prod';
export const isPreview = () => APP_CONFIG.env === 'preview';
export const isTest = () => process.env.NODE_ENV === 'test';

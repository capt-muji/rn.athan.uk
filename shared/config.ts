export const APP_CONFIG = {
  isDev: process.env.EXPO_PUBLIC_ENV !== 'prod' && process.env.EXPO_PUBLIC_ENV !== 'preview',
  env: process.env.EXPO_PUBLIC_ENV || 'local',
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  iosAppId: process.env.EXPO_PUBLIC_IOS_APP_ID,
  androidPackage: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
  /** Dev-only force of the What's New modal on cold launch (EXPO_PUBLIC_WHATS_NEW_PREVIEW=1) */
  whatsNewPreview: process.env.EXPO_PUBLIC_WHATS_NEW_PREVIEW === '1',
};

// Environment helpers
export const isProd = () => APP_CONFIG.env === 'prod';
export const isPreview = () => APP_CONFIG.env === 'preview';
export const isTest = () => process.env.NODE_ENV === 'test';

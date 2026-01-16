export const APP_CONFIG = {
  isDev: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
  env: process.env.EXPO_PUBLIC_ENV || 'local',
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  iosAppId: process.env.EXPO_PUBLIC_IOS_APP_ID,
  androidPackage: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
};

// Environment helpers
export const isProd = () => APP_CONFIG.env === 'prod';
export const isPreview = () => APP_CONFIG.env === 'preview';
export const isLocal = () => APP_CONFIG.env === 'local';

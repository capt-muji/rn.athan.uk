import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

import type { default as Releases } from '@/releases.json';
import { APP_CONFIG } from '@/shared/config';
import { TIME_CONSTANTS } from '@/shared/constants';
import logger from '@/shared/logger';
import { isNewerVersion } from '@/shared/versionUtils';
import { setPopupUpdateLastCheck, getPopupUpdateLastCheck } from '@/stores/ui';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/mugtaba-subahi/rn.athan.uk/main/releases.json';
const IS_IOS = Platform.OS === 'ios';

// Use native URI schemes instead of web URLs
const APP_STORE_URL = `itms-apps://apps.apple.com/app/id${APP_CONFIG.iosAppId}`;
const PLAY_STORE_URL = `market://details?id=${APP_CONFIG.androidPackage}`;

// Fallback URLs in case the native URLs fail
const APP_STORE_FALLBACK_URL = `https://apps.apple.com/app/id${APP_CONFIG.iosAppId}`;
const PLAY_STORE_FALLBACK_URL = `https://play.google.com/store/apps/details?id=${APP_CONFIG.androidPackage}`;

/**
 * Checks if app needs an update by comparing installed version with remote
 * Fetches latest version from GitHub without caching
 * @returns true if update is needed (installed < remote), false otherwise
 */
export const checkForUpdates = async (): Promise<boolean> => {
  const now = Date.now();
  const lastCheck = getPopupUpdateLastCheck();

  if (now - lastCheck < TIME_CONSTANTS.ONE_DAY_MS) return false;

  try {
    const installedVersion = Constants.expoConfig!.version;
    const response = await fetch(GITHUB_RAW_URL, { headers: { 'Cache-Control': 'no-cache' } });
    const remoteVersions: typeof Releases = await response.json();
    const remoteVersion = IS_IOS ? remoteVersions.prod.ios.version : remoteVersions.prod.android.version;

    setPopupUpdateLastCheck(now);

    return isNewerVersion(installedVersion!, remoteVersion);
  } catch (error) {
    logger.error('Failed to check for updates:', error);
    return false;
  }
};

export const openStore = async (): Promise<void> => {
  const url = IS_IOS ? APP_STORE_URL : PLAY_STORE_URL;
  const fallbackUrl = IS_IOS ? APP_STORE_FALLBACK_URL : PLAY_STORE_FALLBACK_URL;

  try {
    const supported = await Linking.canOpenURL(url);
    await Linking.openURL(supported ? url : fallbackUrl);
  } catch (error) {
    logger.error('Failed to open store URL:', error);
    await Linking.openURL(fallbackUrl);
  }
};

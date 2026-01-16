import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

import type { default as Releases } from '@/releases.json';
import { APP_CONFIG } from '@/shared/config';
import logger from '@/shared/logger';
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
 * Compares two semantic version strings and determines if the second version is higher than the first.
 * @param {string} v1 - The first version string (e.g., "1.22.1").
 * @param {string} v2 - The second version string (e.g., "2.0.1").
 * @returns {boolean} - Returns `true` if `v2` is higher than `v1`, otherwise `false`.
 */
const compareVersions = (v1: string, v2: string): boolean => {
  // Split the version strings into arrays of numbers by splitting on the dot ('.') character.
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  // Determine the maximum length between the two version arrays.
  const maxLength = Math.max(parts1.length, parts2.length);

  // Iterate through each part of the version arrays.
  for (let i = 0; i < maxLength; i++) {
    // If the current index is beyond the length of the array, treat it as 0 (for normalization).
    const num1 = i < parts1.length ? parts1[i] : 0;
    const num2 = i < parts2.length ? parts2[i] : 0;

    // Compare the corresponding parts numerically.
    if (num2 > num1) {
      // If the part of `v2` is greater than the part of `v1`, `v2` is higher.
      return true;
    } else if (num2 < num1) {
      // If the part of `v2` is less than the part of `v1`, `v2` is not higher.
      return false;
    }
    // If the parts are equal, continue to the next part.
  }

  // If all parts are equal, `v2` is not higher than `v1`.
  return false;
};

/**
 * Checks if app needs an update by comparing installed version with remote
 * Fetches latest version from GitHub without caching
 * @returns true if update is needed (installed < remote), false otherwise
 */
export const checkForUpdates = async (): Promise<boolean> => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const now = Date.now();
  const lastCheck = getPopupUpdateLastCheck();

  if (now - lastCheck < ONE_DAY_MS) return false;

  try {
    const installedVersion = Constants.expoConfig!.version;
    const response = await fetch(GITHUB_RAW_URL, { headers: { 'Cache-Control': 'no-cache' } });
    const remoteVersions: typeof Releases = await response.json();
    const remoteVersion = IS_IOS ? remoteVersions.prod.ios.version : remoteVersions.prod.android.version;

    setPopupUpdateLastCheck(now);

    return compareVersions(installedVersion!, remoteVersion);
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

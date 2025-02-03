import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

import type { default as Releases } from '@/releases.json';
import logger from '@/shared/logger';
import { setPopupUpdateLastCheck, getPopupUpdateLastCheck } from '@/stores/ui';

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/mugtaba-subahi/rn.athan.uk/main/releases.json';
const IS_IOS = Platform.OS === 'ios';

// Use native URI schemes instead of web URLs
const APP_STORE_URL = `itms-apps://apps.apple.com/app/id${process.env.EXPO_PUBLIC_IOS_APP_ID}`;
const PLAY_STORE_URL = `market://details?id=${process.env.EXPO_PUBLIC_ANDROID_PACKAGE}`;

// Fallback URLs in case the native URLs fail
const APP_STORE_FALLBACK_URL = `https://apps.apple.com/app/id${process.env.EXPO_PUBLIC_IOS_APP_ID}`;
const PLAY_STORE_FALLBACK_URL = `https://play.google.com/store/apps/details?id=${process.env.EXPO_PUBLIC_ANDROID_PACKAGE}`;

/**
 * Compares versions by converting them to numbers (e.g. 2.1.0 -> 210)
 * @returns true if v1 is older than v2
 */
function compareVersions(v1: string, v2: string): boolean {
  const num1 = Number(v1.split('.').join(''));
  const num2 = Number(v2.split('.').join(''));
  return num1 < num2;
}

/**
 * Checks if app needs an update by comparing installed version with remote
 * Fetches latest version from GitHub without caching
 * @returns true if update is needed (installed < remote), false otherwise
 */
export async function checkForUpdates(): Promise<boolean> {
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
}

export async function openStore(): Promise<void> {
  const url = IS_IOS ? APP_STORE_URL : PLAY_STORE_URL;
  const fallbackUrl = IS_IOS ? APP_STORE_FALLBACK_URL : PLAY_STORE_FALLBACK_URL;

  try {
    const supported = await Linking.canOpenURL(url);
    await Linking.openURL(supported ? url : fallbackUrl);
  } catch (error) {
    logger.error('Failed to open store URL:', error);
    await Linking.openURL(fallbackUrl);
  }
}

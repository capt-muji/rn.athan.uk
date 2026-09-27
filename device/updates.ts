import { Linking, Platform } from 'react-native';

import { APP_CONFIG } from '@/shared/config';
import { TIME_CONSTANTS } from '@/shared/constants';
import logger from '@/shared/logger';
import { isNewerVersion } from '@/shared/versionUtils';
import { getPopupUpdateLastCheck, setPopupUpdateLastCheck } from '@/stores/ui';
import { getInstalledVersion } from '@/stores/version';

const IS_IOS = Platform.OS === 'ios';

// country=gb is load-bearing, not tidiable: the app is published in the GB storefront alone and a
// bundleId lookup is storefront-scoped, so every other country answers resultCount 0
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb';
const PLAY_LISTING_URL = `https://play.google.com/store/apps/details?id=${APP_CONFIG.androidPackage}&hl=en&gl=GB`;

const APP_STORE_URL = `https://apps.apple.com/gb/app/athan-london/id${APP_CONFIG.iosAppId}`;
const PLAY_STORE_URL = `market://details?id=${APP_CONFIG.androidPackage}`;

// Keyed on the payload's version field, never on the version's shape: the listing holds 8 matches for a
// bare dotted number and 7 of them are SVG path coordinates
const PLAY_VERSION_KEY = /"141":\s*\[\s*\[\s*\[\s*"([^"]+)"/;
const DOTTED_NUMBERS = /^\d+(\.\d+)*$/;

/**
 * The version the Play listing publishes, or null when it carries none this reader can compare
 * @param html The listing page as served
 */
export const readPlayListingVersion = (html: string): string | null => {
  const version = PLAY_VERSION_KEY.exec(html)?.[1];

  return version !== undefined && DOTTED_NUMBERS.test(version) ? version : null;
};

/**
 * The version the platform's own store publishes: the App Store on iOS, the Play listing on Android
 * @returns The store's version, or false when it could not be read
 */
const getStoreVersion = async (): Promise<string | false> => {
  try {
    if (IS_IOS) {
      const response = await fetch(ITUNES_LOOKUP_URL, { headers: { 'Cache-Control': 'no-cache' } });
      const data: { results: { version: string }[] } = await response.json();
      return data.results[0]?.version || false;
    }

    const response = await fetch(PLAY_LISTING_URL, { headers: { 'Cache-Control': 'no-cache' } });
    const html = await response.text();
    return readPlayListingVersion(html) || false;
  } catch (error) {
    logger.warn('Failed to fetch store version:', error);
    return false;
  }
};

/**
 * Checks if app needs an update by comparing installed version with store version
 * Throttled to once per 24 hours
 * @returns true if update is needed (installed < store), false otherwise
 */
export const checkForUpdates = async (): Promise<boolean> => {
  const now = Date.now();
  const lastCheck = getPopupUpdateLastCheck();

  if (now - lastCheck < TIME_CONSTANTS.ONE_DAY_MS) return false;

  try {
    const installedVersion = getInstalledVersion();
    const storeVersion = await getStoreVersion();

    if (!installedVersion || !storeVersion) return false;

    return isNewerVersion(installedVersion, storeVersion);
  } catch (error) {
    logger.error('Failed to check for updates:', error);
    return false;
  } finally {
    setPopupUpdateLastCheck(now);
  }
};

export const openStore = async (): Promise<void> => {
  const url = IS_IOS ? APP_STORE_URL : PLAY_STORE_URL;

  try {
    await Linking.openURL(url);
  } catch (error) {
    logger.error('Failed to open store URL:', error);
  }
};

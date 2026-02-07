import { Platform, Linking } from 'react-native';

import { APP_CONFIG, isProd } from '@/shared/config';
import { TIME_CONSTANTS } from '@/shared/constants';
import logger from '@/shared/logger';
import { isNewerVersion } from '@/shared/versionUtils';
import { setPopupUpdateLastCheck, getPopupUpdateLastCheck } from '@/stores/ui';
import { getInstalledVersion } from '@/stores/version';

const IS_IOS = Platform.OS === 'ios';

const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup?bundleId=com.mugtaba.athan&country=gb';
const RELEASES_URL = 'https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json';

const APP_STORE_URL = `https://apps.apple.com/gb/app/athan-london/id${APP_CONFIG.iosAppId}`;
const PLAY_STORE_URL = `market://details?id=${APP_CONFIG.androidPackage}`;

type PlatformVersion = { version: string | null };
type UpdatePopup = { ios: PlatformVersion; android: PlatformVersion };
type ReleasesConfig = { production: { updatePopup: UpdatePopup }; uat: { updatePopup: UpdatePopup } };

/**
 * Fetches the latest store version for the current platform
 * Production iOS: iTunes Lookup API (automatic, reads live App Store version)
 * Everything else: releases.json from GitHub main branch (manual)
 */
const getStoreVersion = async (): Promise<string | false> => {
  try {
    if (IS_IOS && isProd()) {
      const response = await fetch(ITUNES_LOOKUP_URL, { headers: { 'Cache-Control': 'no-cache' } });
      const data: { results: { version: string }[] } = await response.json();
      return data.results[0]?.version || false;
    }

    const response = await fetch(RELEASES_URL, { headers: { 'Cache-Control': 'no-cache' } });
    const data: ReleasesConfig = await response.json();
    const env = isProd() ? 'production' : 'uat';
    const platform = IS_IOS ? 'ios' : 'android';
    return data[env]?.updatePopup?.[platform]?.version || false;
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

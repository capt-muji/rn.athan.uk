import * as InAppUpdates from 'expo-in-app-updates';
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

const APP_STORE_URL = `https://apps.apple.com/gb/app/athan-london/id${APP_CONFIG.iosAppId}`;

/**
 * Asks Play for an update and starts the flexible flow when there is one
 * @returns Whether Play answered, which is false when it could not be reached
 */
export const startNativeUpdate = async (): Promise<boolean> => {
  try {
    const { updateAvailable } = await InAppUpdates.checkForUpdate();

    // No argument selects flexible, so the app stays usable while Play downloads, and Play Console's
    // updatePriority can escalate later without an app change
    if (updateAvailable) await InAppUpdates.startUpdate();

    return true;
  } catch (error) {
    logger.warn('Failed to start native update:', error);
    return false;
  }
};

// AbortSignal.timeout reads better and is armed by a host timer jest's fake timers cannot drive, so a
// test of this would cost its whole timeout in real seconds
const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIME_CONSTANTS.UPDATE_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * The version the App Store publishes
 * @returns The store's version, null when it published none, or false when the read failed
 */
const getStoreVersion = async (): Promise<string | null | false> => {
  try {
    const response = await fetchWithTimeout(ITUNES_LOOKUP_URL);
    const data: { results: { version: string }[] } = await response.json();
    return data.results[0]?.version ?? null;
  } catch (error) {
    logger.warn('Failed to fetch store version:', error);
    return false;
  }
};

/**
 * Checks whether an update is available, throttled to once per 24 hours
 * @returns Whether to show the update modal, which is always false on Android because Play's own overlay owns that flow
 */
export const checkForUpdates = async (): Promise<boolean> => {
  const now = Date.now();
  const lastCheck = getPopupUpdateLastCheck();

  if (now - lastCheck < TIME_CONSTANTS.ONE_DAY_MS) return false;

  // A read that never reached the store is not a check, so it costs an hour instead of the whole day
  const stampFailure = () => setPopupUpdateLastCheck(now - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS);

  try {
    if (!IS_IOS) {
      const awaitedNative = await startNativeUpdate();

      if (awaitedNative) setPopupUpdateLastCheck(now);
      else stampFailure();

      return false;
    }

    const installedVersion = getInstalledVersion();
    const storeVersion = await getStoreVersion();

    if (storeVersion === false) {
      stampFailure();
      return false;
    }

    setPopupUpdateLastCheck(now);

    if (!installedVersion || !storeVersion) return false;

    return isNewerVersion(installedVersion, storeVersion);
  } catch (error) {
    logger.error('Failed to check for updates:', error);
    stampFailure();
    return false;
  }
};

export const openStore = async (): Promise<void> => {
  try {
    await Linking.openURL(APP_STORE_URL);
  } catch (error) {
    logger.error('Failed to open store URL:', error);
  }
};

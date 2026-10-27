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
// bundleId lookup is storefront-scoped, so every other country answers resultCount 0. The bundle
// id comes from the build, never from the source: a clone's build looks up its own app.
const ITUNES_LOOKUP_URL = `https://itunes.apple.com/lookup?bundleId=${APP_CONFIG.iosBundleId}&country=gb`;

const APP_STORE_URL = `https://apps.apple.com/gb/app/athan-london/id${APP_CONFIG.iosAppId}`;

/**
 * Asks Play for an update and starts the flexible flow when there is one
 * @returns Whether Play answered, and whether it has an update whose flexible flow has started
 */
export const startNativeUpdate = async (): Promise<{ answered: boolean; updateAvailable: boolean }> => {
  try {
    const { updateAvailable } = await InAppUpdates.checkForUpdate();

    // No argument selects flexible, so the app stays usable while Play downloads, and Play Console's
    // updatePriority can escalate later without an app change
    if (updateAvailable) await InAppUpdates.startUpdate();

    return { answered: true, updateAvailable };
  } catch (error) {
    logger.warn('Failed to start native update:', error);
    return { answered: false, updateAvailable: false };
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

/** What one run of the update check learned */
export type UpdateCheckResult = {
  /** Whether the app's own update modal should be shown, which is always false on Android because Play's own overlay owns that flow */
  modal: boolean;
  /** Whether the store answered and no update exists, so an inline "up to date" is a verdict and not silence */
  upToDate: boolean;
};

/**
 * Checks whether an update is available, throttled to once per 24 hours
 * @param manual Skips the 24-hour stamp read for this call alone; the stamp is still written, so the automatic check never double-fires the window
 * @returns What the check learned: whether to show the update modal, and whether the store answered with no update
 */
export const checkForUpdates = async ({ manual = false }: { manual?: boolean } = {}): Promise<UpdateCheckResult> => {
  const now = Date.now();
  const lastCheck = getPopupUpdateLastCheck();

  if (!manual && now - lastCheck < TIME_CONSTANTS.ONE_DAY_MS) return { modal: false, upToDate: false };

  // A read that never reached the store is not a check, so it costs an hour instead of the whole day
  const stampFailure = () => setPopupUpdateLastCheck(now - TIME_CONSTANTS.ONE_DAY_MS + TIME_CONSTANTS.UPDATE_RETRY_MS);

  try {
    if (!IS_IOS) {
      const native = await startNativeUpdate();

      if (native.answered) setPopupUpdateLastCheck(now);
      else stampFailure();

      return { modal: false, upToDate: native.answered && !native.updateAvailable };
    }

    const installedVersion = getInstalledVersion();
    const storeVersion = await getStoreVersion();

    if (storeVersion === false) {
      stampFailure();
      return { modal: false, upToDate: false };
    }

    setPopupUpdateLastCheck(now);

    // An empty result or an unreadable installed version means no comparison ran, so nothing is claimed
    if (!installedVersion || !storeVersion) return { modal: false, upToDate: false };

    const updateAvailable = isNewerVersion(installedVersion, storeVersion);

    return { modal: updateAvailable, upToDate: !updateAvailable };
  } catch (error) {
    logger.error('Failed to check for updates:', error);
    stampFailure();
    return { modal: false, upToDate: false };
  }
};

export const openStore = async (): Promise<void> => {
  try {
    await Linking.openURL(APP_STORE_URL);
  } catch (error) {
    logger.error('Failed to open store URL:', error);
  }
};

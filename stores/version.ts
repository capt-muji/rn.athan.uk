import Constants from 'expo-constants';

import logger from '@/shared/logger';
import { compareVersions } from '@/shared/versionUtils';
import * as Database from '@/stores/database';
import { lastNotificationScheduleAtom, migrateIndexKeyedAlertPreferences } from '@/stores/notifications';
import { resetStoredAtom } from '@/stores/storage';

// Guard to prevent multiple upgrade handlers from running
let upgradeHandled = false;

/**
 * Gets the current app version from Expo config
 * @returns Version string (e.g. "1.0.34") or empty string if not available
 */
export const getInstalledVersion = (): string => {
  try {
    return Constants.expoConfig?.version || '';
  } catch (error) {
    logger.warn('VERSION: Failed to read installed version', { error });
    return '';
  }
};

/**
 * Gets the stored version from MMKV
 * @returns Version string or null if not stored
 */
export const getStoredVersion = (): string | null => {
  try {
    return Database.getItem('app_installed_version');
  } catch (error) {
    logger.warn('VERSION: Failed to read stored version', { error });
    return null;
  }
};

/**
 * Stores the current app version in MMKV
 * @param version - Version string to store
 */
export const setStoredVersion = (version: string): void => {
  try {
    Database.setItem('app_installed_version', version);
    logger.info('VERSION: Stored version updated', { version });
  } catch (error) {
    logger.error('VERSION: Failed to store version', { version, error });
  }
};

/**
 * Gets the version the What's New modal was last shown for
 * @returns Version string or null if not stored
 */
export const getWhatsNewShownVersion = (): string | null => {
  try {
    return Database.getItem(WHATS_NEW_SHOWN_VERSION_KEY);
  } catch (error) {
    logger.warn("VERSION: Failed to read What's New shown version", { error });
    return null;
  }
};

/**
 * Records the version the What's New modal has been shown for
 * Called on modal display (not dismiss) so a crash mid-display cannot loop it
 * @param version - Version string to store
 */
export const setWhatsNewShownVersion = (version: string): void => {
  try {
    Database.setItem(WHATS_NEW_SHOWN_VERSION_KEY, version);
    logger.info("VERSION: What's New shown version updated", { version });
  } catch (error) {
    logger.error("VERSION: Failed to store What's New shown version", { version, error });
  }
};

/**
 * Checks if the app was upgraded (version increased)
 * @returns true if upgrade detected (or first install), false otherwise
 */
export const wasAppUpgraded = (): boolean => {
  const installedVersion = getInstalledVersion();
  const storedVersion = getStoredVersion();

  // First install - no stored version
  if (!storedVersion) {
    logger.info('VERSION: First install detected (no stored version)', { installedVersion });
    return true;
  }

  // Same version - no upgrade
  if (installedVersion === storedVersion) {
    logger.info('VERSION: Same version detected (no upgrade needed)', { version: installedVersion });
    return false;
  }

  // Compare versions - only return true if installed > stored (upgrade)
  const comparison = compareVersions(installedVersion, storedVersion);

  if (comparison > 0) {
    logger.info('VERSION: Upgrade detected (version increased)', { from: storedVersion, to: installedVersion });
    return true;
  }

  // Downgrade - don't clear cache
  logger.warn('VERSION: Downgrade detected (skipping cache clear)', { from: storedVersion, to: installedVersion });
  return false;
};

/**
 * Storage key holding the version the What's New modal was last shown for.
 * Seeded to the installed version on fresh install (modal never shows for
 * them), left untouched on upgrade (differs from installed → modal shows).
 */
const WHATS_NEW_SHOWN_VERSION_KEY = 'whats_new_shown_version';

/**
 * Shape version for everything held in the MMKV cache: the prayer days, the
 * scheduled-notification bookkeeping, the fetched-year markers.
 *
 * BUMP THIS ONLY when a release changes the SHAPE of cached data, so that data
 * written by the previous version can no longer be read correctly — as #29 did
 * when it removed the stored night fields. Do NOT bump it for ordinary
 * releases.
 *
 * Why it exists: clearing the cache on every version bump is pure cost when the
 * shape did not change. It forces a refetch, leaves the app with no timetable
 * at all until that completes (update overnight, open on a train, see nothing),
 * and until #34 it took the armed notifications with it. The wipe is the right
 * answer to schema drift — a stale-shaped record read by new code produces a
 * wrong prayer time, the worst bug this app can have — and the wrong answer to
 * everything else.
 */
export const CACHE_SCHEMA_VERSION = 1;

const CACHE_SCHEMA_VERSION_KEY = 'cache_schema_version';

/**
 * Key prefixes to KEEP during upgrade cleanup (whitelist approach)
 * Everything NOT starting with these prefixes will be deleted
 * This ensures orphaned/unknown keys are cleaned up automatically
 */
const UPGRADE_KEEP_PREFIXES: string[] = [
  // System State - NEVER delete
  'app_installed_version', // Version tracker itself
  'whats_new_shown_version', // What's New display tracker (see shared/whatsNew.ts)
  'cache_schema_version', // Cache shape marker (also re-stamped after a wipe)

  // User Preferences - must persist across upgrades
  'preference_', // All user preferences (alerts, sound, countdownbar, hijri, show_*, reminder_*)

  // Cached layout measurements - prayer names and fonts are constants, so the
  // measured column widths are valid forever (recomputing them reflows the list)
  'prayer_max_english_width_',
];

/**
 * Whether the cached data was written under a different shape than this build
 * expects.
 *
 * A missing marker means the cache predates the marker itself, so its shape
 * cannot be vouched for — treated as changed, which costs exactly one wipe on
 * the first update after this shipped.
 */
export const cacheSchemaChanged = (): boolean => {
  try {
    const stored = Database.getItem(CACHE_SCHEMA_VERSION_KEY);

    if (stored === null || stored === undefined) {
      logger.info('VERSION: No cache schema marker - treating the cache as unknown shape');
      return true;
    }

    return stored !== CACHE_SCHEMA_VERSION;
  } catch (error) {
    logger.warn('VERSION: Failed to read cache schema version', { error });
    return true;
  }
};

/**
 * Reopens the 12-hour notification refresh gate so the next foreground
 * reschedules.
 *
 * Goes through the atom, never the key. `lastNotificationScheduleAtom` is read
 * with `store.get` and nothing in the tree subscribes to it, so it holds the
 * snapshot taken when `stores/notifications` was evaluated — which is before
 * this runs. Removing the key on its own left `shouldRescheduleNotifications()`
 * reading the stale timestamp and skipping the very reschedule this exists to
 * force. Cheap and idempotent: same-identifier scheduling replaces in place, so
 * a reschedule that finds nothing to change leaves no gap.
 */
const forceNotificationReschedule = (): void => {
  try {
    resetStoredAtom(lastNotificationScheduleAtom, 'preference_last_notification_schedule_check');
    logger.info('VERSION: Reset notification schedule timestamp to force reschedule');
  } catch (error) {
    logger.warn('VERSION: Failed to reset notification schedule timestamp', { error });
  }
};

/**
 * Clears cache data that may be incompatible after an upgrade
 * Uses whitelist approach: keeps ONLY keys matching UPGRADE_KEEP_PATTERNS
 * Everything else (cache, schedules, measurements) gets deleted
 */
export const clearUpgradeCache = (): void => {
  const startTime = Date.now();
  logger.info('VERSION: Beginning cache clear process (whitelist approach)');

  try {
    Database.clearAllExcept(UPGRADE_KEEP_PREFIXES);

    forceNotificationReschedule();

    const duration = Date.now() - startTime;
    logger.info('VERSION: Cache clear completed successfully', { duration });
  } catch (error) {
    logger.error('VERSION: Cache clear failed', { error });
    // Don't throw - allow app to continue even if cache clear fails
  }
};

/**
 * Entry point for handling app upgrades
 * Checks for upgrade, clears cache if needed, and updates stored version
 * Includes race condition guard to prevent multiple executions
 */
export const handleAppUpgrade = (): void => {
  logger.info('VERSION: Starting upgrade check');

  // Race condition guard - only run once per app launch
  if (upgradeHandled) {
    logger.info('VERSION: Upgrade check already handled this session');
    return;
  }

  upgradeHandled = true;

  const installedVersion = getInstalledVersion();
  const storedVersion = getStoredVersion();

  logger.info('VERSION: Version comparison', { installed: installedVersion, stored: storedVersion || 'none' });

  if (!installedVersion) {
    logger.warn('VERSION: Could not determine installed version, skipping upgrade check');
    return;
  }

  const upgraded = wasAppUpgraded();

  // Two separate questions, conflated until #34. That the app VERSION changed
  // means new code may schedule differently, so force one reschedule. That the
  // cached DATA needs clearing is a different question entirely, and only true
  // when its shape changed — clearing on every release is what emptied the
  // timetable for offline users and took the armed alerts with it.
  if (upgraded && cacheSchemaChanged()) {
    logger.info('VERSION: Cache schema changed - clearing cache', { schema: CACHE_SCHEMA_VERSION });
    clearUpgradeCache();
  } else if (upgraded) {
    logger.info('VERSION: Updated, cache schema unchanged - keeping cached data', { schema: CACHE_SCHEMA_VERSION });
    forceNotificationReschedule();
  } else {
    logger.info('VERSION: No upgrade detected - skipping cache clear');
  }

  // Always update stored version to current version
  setStoredVersion(installedVersion);

  // Stamp the shape marker so the next update has something to compare against.
  // Deliberately outside clearUpgradeCache: it must land whether or not a wipe
  // ran, and that function's own error handling must never swallow it.
  Database.setItem(CACHE_SCHEMA_VERSION_KEY, CACHE_SCHEMA_VERSION);

  // Fresh install: seed the What's New tracker so the modal never shows for
  // new users. Upgrades leave it untouched - its difference from the
  // installed version is what triggers the modal (see shared/whatsNew.ts)
  if (!storedVersion) setWhatsNewShownVersion(installedVersion);

  // Migrate legacy index-keyed alert preference keys to name-keyed keys.
  // Runs on every launch (no-op after the first); must complete before any
  // notification scheduling reads the preference atoms.
  migrateIndexKeyedAlertPreferences();

  logger.info('VERSION: Upgrade check completed');
};

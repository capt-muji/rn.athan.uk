import Constants from 'expo-constants';

import logger from '@/shared/logger';
import { compareVersions } from '@/shared/versionUtils';
import * as Database from '@/stores/database';

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
 * Key prefixes to KEEP during upgrade cleanup (whitelist approach)
 * Everything NOT starting with these prefixes will be deleted
 * This ensures orphaned/unknown keys are cleaned up automatically
 */
const UPGRADE_KEEP_PREFIXES: string[] = [
  // System State - NEVER delete
  'app_installed_version', // Version tracker itself

  // User Preferences - must persist across upgrades
  'preference_', // All user preferences (alerts, sound, countdownbar, hijri, show_*, reminder_*)
];

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

    // Force notification reschedule by resetting the schedule timestamp
    // This ensures old OS-level notifications are cancelled after upgrade
    // Note: Jotai atom reads from MMKV lazily on first access, so removing the
    // key before shouldRescheduleNotifications() is called ensures it returns true
    Database.database.remove('preference_last_notification_schedule_check');
    logger.info('VERSION: Reset notification schedule timestamp to force reschedule');

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

  if (wasAppUpgraded()) {
    logger.info('VERSION: Upgrade detected - clearing cache');
    clearUpgradeCache();
  } else {
    logger.info('VERSION: No upgrade detected - skipping cache clear');
  }

  // Always update stored version to current version
  setStoredVersion(installedVersion);
  logger.info('VERSION: Upgrade check completed');
};

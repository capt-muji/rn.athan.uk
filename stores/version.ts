import Constants from 'expo-constants';

import logger from '@/shared/logger';
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
 * Compares two version strings using semantic versioning rules
 * @param v1 - First version string (e.g. "1.0.33")
 * @param v2 - Second version string (e.g. "1.0.34")
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
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
    logger.info('VERSION: First install detected', { installedVersion });
    return true;
  }

  // Same version - no upgrade
  if (installedVersion === storedVersion) {
    return false;
  }

  // Compare versions - only return true if installed > stored (upgrade)
  const comparison = compareVersions(installedVersion, storedVersion);

  if (comparison > 0) {
    logger.info('VERSION: App upgrade detected', { from: storedVersion, to: installedVersion });
    return true;
  }

  // Downgrade - don't clear cache
  logger.warn('VERSION: App downgrade detected (not clearing cache)', { from: storedVersion, to: installedVersion });
  return false;
};

/**
 * Clears cache data that may be incompatible after an upgrade
 * Preserves user preferences (notification settings, sound choices, etc.)
 */
export const clearUpgradeCache = (): void => {
  const startTime = Date.now();

  try {
    // Prayer data - may have schema changes
    Database.clearPrefix('prayer_');
    logger.info('VERSION: Cleared prayer_* data');

    // Display dates - derived from prayer data
    Database.clearPrefix('display_date');
    logger.info('VERSION: Cleared display_date* data');

    // Fetched years tracking - force fresh API sync
    Database.clearPrefix('fetched_years');
    logger.info('VERSION: Cleared fetched_years');

    // Scheduled notifications - will reschedule with new data
    Database.clearPrefix('scheduled_notifications_');
    logger.info('VERSION: Cleared scheduled_notifications_*');

    // Last notification check - ensure immediate reschedule
    Database.clearPrefix('last_notification_schedule_check');
    logger.info('VERSION: Cleared last_notification_schedule_check');

    // UI measurements - may change with UI updates
    Database.clearPrefix('measurements_');
    logger.info('VERSION: Cleared measurements_*');

    // Prayer text width cache - may change with font/UI updates
    Database.clearPrefix('prayer_max_english_width_');
    logger.info('VERSION: Cleared prayer_max_english_width_*');

    // Update check timestamp - re-check for updates
    Database.clearPrefix('popup_update_last_check');
    logger.info('VERSION: Cleared popup_update_last_check');

    const duration = Date.now() - startTime;
    logger.info('VERSION: Cache cleared successfully', { duration });
  } catch (error) {
    logger.error('VERSION: Failed to clear cache', { error });
    // Don't throw - allow app to continue even if cache clear fails
  }
};

/**
 * Entry point for handling app upgrades
 * Checks for upgrade, clears cache if needed, and updates stored version
 * Includes race condition guard to prevent multiple executions
 */
export const handleAppUpgrade = (): void => {
  // Race condition guard - only run once per app launch
  if (upgradeHandled) {
    logger.info('VERSION: Upgrade check already handled this session');
    return;
  }

  upgradeHandled = true;

  const installedVersion = getInstalledVersion();

  if (!installedVersion) {
    logger.warn('VERSION: Could not determine installed version, skipping upgrade check');
    return;
  }

  if (wasAppUpgraded()) {
    clearUpgradeCache();
  }

  // Always update stored version to current version
  setStoredVersion(installedVersion);
};

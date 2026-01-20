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
 * Clears cache data that may be incompatible after an upgrade
 * Preserves user preferences (notification settings, sound choices, etc.)
 */
export const clearUpgradeCache = (): void => {
  const startTime = Date.now();
  logger.info('VERSION: Beginning cache clear process');

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

    // Prayer text width cache - may change with font/UI updates
    Database.clearPrefix('prayer_max_english_width_');
    logger.info('VERSION: Cleared prayer_max_english_width_*');

    // Update check timestamp - re-check for updates
    Database.clearPrefix('popup_update_last_check');
    logger.info('VERSION: Cleared popup_update_last_check');

    // ============================================================================
    // NOT CLEARED - User Preferences (must persist across upgrades)
    // ============================================================================

    // Database.clearPrefix('preference_alert_standard_'); // User's notification preferences for Standard prayers
    // Database.clearPrefix('preference_alert_extra_'); // User's notification preferences for Extra prayers
    // Database.clearPrefix('preference_sound'); // User's selected Athan audio
    // Database.clearPrefix('preference_mute_standard'); // User's mute state for Standard prayers
    // Database.clearPrefix('preference_mute_extra'); // User's mute state for Extra prayers
    // Database.clearPrefix('preference_progressbar_hidden'); // User's progress bar hidden preference
    // Database.clearPrefix('preference_hijri_date'); // User's Hijri date preference

    // ============================================================================
    // NOT CLEARED - System State (must persist across upgrades)
    // ============================================================================

    // Database.clearPrefix('app_installed_version'); // This is the version tracker itself (never clear)
    // Database.clearPrefix('popup_tip_athan_enabled'); // Don't re-show dismissed first-time tips

    const duration = Date.now() - startTime;
    logger.info('VERSION: Cache clear completed successfully', { duration });
    logger.info('VERSION: Preserved user preferences (preference_*, popup_tip_athan_enabled)');
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

import { AppState, AppStateStatus } from 'react-native';

import logger from '@/shared/logger';
import { sync } from '@/stores/sync';
import { setSyncTrigger } from '@/stores/ui';

/**
 * Initializes app state change listeners
 * Handles timer synchronization when app returns from background
 */
export const initializeListeners = () => {
  // Track the previous app state to detect transitions
  let previousAppState = AppState.currentState;

  /**
   * Handles app state changes between active, background, and inactive states
   * Only syncs timers when app comes back to foreground to prevent drift
   */
  const handleAppStateChange = (newAppState: AppStateStatus) => {
    // Check if app was in background or inactive state
    const isComingFromBackground = previousAppState.match(/inactive|background/);
    // Check if app is now active/in foreground
    const isNowActive = newAppState === 'active';

    // Only sync if transitioning from background to active
    if (isComingFromBackground && isNowActive) {
      sync()
        .then(() => setSyncTrigger())
        .catch((error) => logger.error('Failed to sync on app state change', { error }));
    }

    // Update state tracking for next change
    previousAppState = newAppState;
  };

  // Subscribe to app state changes
  AppState.addEventListener('change', handleAppStateChange);
};

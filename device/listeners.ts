import { AppState, AppStateStatus } from 'react-native';

import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { sync } from '@/stores/sync';

/**
 * Initializes app state change listeners
 * Handles notification refresh when app returns from background
 */
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  let previousAppState = AppState.currentState;

  const handleAppStateChange = (newState: AppStateStatus) => {
    // Only run when coming from background, not on initial app launch
    // This prevents double initialization since index.tsx handles initial launch
    if (previousAppState === 'background' && newState === 'active') {
      logger.info('APP STATE: Background to active transition');
      initializeNotifications(checkPermissions);

      // Refresh data on app return without blocking UI
      sync();
    }

    previousAppState = newState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};

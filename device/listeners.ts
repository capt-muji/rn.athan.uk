import { AppState, AppStateStatus } from 'react-native';

import { initializeNotifications } from '@/shared/notifications';
import { sync } from '@/stores/sync';
import { setRefreshUI } from '@/stores/ui';

/**
 * Initializes app state change listeners
 * Handles notification refresh when app returns from background
 */
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  let previousAppState = AppState.currentState;

  // Handle both initial state and state changes
  const handleAppStateChange = (newState: AppStateStatus) => {
    if (newState === 'active') {
      // Only initialize notifications when coming from background
      // NOT on initial app launch (handled by app/index.tsx)
      if (previousAppState === 'background') {
        initializeNotifications(checkPermissions);
      }

      // Only run sync when coming from background
      // This prevents double initialization since we already sync on launch
      if (previousAppState === 'background') {
        sync().then(() => {
          // Refresh UI after sync is complete
          setRefreshUI(Date.now());
        });
      }
    }

    previousAppState = newState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};

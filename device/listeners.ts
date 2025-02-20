import { AppState, AppStateStatus } from 'react-native';

import { sync } from '@/stores/sync';
import { setRefreshUI } from '@/stores/ui';

/**
 * Initializes app state change listeners
 * Handles notification refresh when app returns from background
 */
export const initializeListeners = () => {
  let previousAppState = AppState.currentState;

  const handleAppStateChange = (newState: AppStateStatus) => {
    // Only run when coming from background, not on initial app launch
    // This prevents double initialization since index.tsx handles initial launch
    if (previousAppState === 'background' && newState === 'active') {
      // Run sync in background to prevent UI freeze on app open
      sync().then(() => {
        // Refresh UI after sync is complete
        setRefreshUI(Date.now());
      });
    }

    previousAppState = newState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};

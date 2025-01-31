import { AppState, AppStateStatus } from 'react-native';

import { useNotification } from '@/hooks/useNotification';
import { initializeNotifications } from '@/shared/notifications';

/**
 * Initializes app state change listeners
 * Handles notification refresh when app returns from background
 */
export const initializeListeners = () => {
  let previousAppState = AppState.currentState;
  const { checkInitialPermissions } = useNotification();

  const handleAppStateChange = (newAppState: AppStateStatus) => {
    // Only run when coming from background, not on initial app launch
    // This prevents double initialization since index.tsx handles initial launch
    if (previousAppState === 'background' && newAppState === 'active') {
      initializeNotifications(checkInitialPermissions);
    }

    previousAppState = newAppState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};

import * as NavigationBar from 'expo-navigation-bar';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { initializeNotifications } from '@/shared/notifications';
import { refreshNotifications } from '@/stores/notifications';
import { sync } from '@/stores/sync';
import { setRefreshUI } from '@/stores/ui';

/**
 * Ensures Android navigation bar is visible with solid black background
 * Forces black regardless of system theme preferences
 * No-op on iOS
 */
export const configureNavigationBar = async () => {
  if (Platform.OS !== 'android') return;
  await NavigationBar.setVisibilityAsync('visible');
  await NavigationBar.setBackgroundColorAsync('#000000');
};

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
        configureNavigationBar();
        initializeNotifications(checkPermissions, refreshNotifications);
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

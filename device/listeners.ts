import { AppState, type AppStateStatus } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { checkOverlayBoundary, resyncCountdowns } from '@/stores/countdown';
import { refreshNotifications, registerBackgroundTask } from '@/stores/notifications';
import { sync } from '@/stores/sync';
import { bumpResync } from '@/stores/ui';
import { initWidgetSettingsSync } from '@/stores/widget';

/** The subscription is never removed, so a second call would stack a duplicate
 *  handler and double every resume action. The caller's `clearTimeout` cleanup
 *  used to absorb React StrictMode's double-invoked mount effect in dev;
 *  registration is synchronous now, so the guard has to live here. */
let listenersInitialized = false;

/**
 * Initializes app state change listeners
 * Handles notification refresh when app returns from background
 */
export const initializeListeners = (checkPermissions: () => Promise<boolean>) => {
  if (listenersInitialized) return;
  listenersInitialized = true;

  let previousAppState = AppState.currentState;

  // Widgets follow in-app settings while the app runs (debounced re-push)
  initWidgetSettingsSync();

  // Handle both initial state and state changes
  const handleAppStateChange = (newState: AppStateStatus) => {
    const returningToForeground = newState === 'active' && previousAppState !== 'active';

    if (returningToForeground) {
      // A boundary that elapsed while the host was suspended closes the
      // overlay; the countdowns catch up to the wall clock; then every derived
      // animation re-runs and snaps. The OS freezes JS in the background, so
      // this instant catch-up is what keeps the first visible frame correct.
      checkOverlayBoundary();
      resyncCountdowns();
      bumpResync();
    }

    if (newState === 'active' && previousAppState === 'background') {
      // Re-apply system bars styling on Android (fixes transparency reset)
      SystemBars.setStyle('light');
      SystemBars.setHidden({ navigationBar: false });

      initializeNotifications(checkPermissions, refreshNotifications, registerBackgroundTask);

      // Refresh prayer data after returning from background (not on launch,
      // which app/index.tsx already handles)
      sync().catch((error) => logger.error('LISTENERS: Foreground sync failed', { error }));
    }

    previousAppState = newState;
  };

  AppState.addEventListener('change', handleAppStateChange);
};

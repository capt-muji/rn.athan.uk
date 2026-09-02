import * as SplashScreen from 'expo-splash-screen';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Navigation from '@/app/Navigation';
import { ModalUpdate, ModalWhatsNew } from '@/components/modals';
import { Overlay } from '@/components/overlay';
import { ErrorScreen } from '@/components/ui';
import { runBackgroundTaskDebugSequence } from '@/device/backgroundTaskDebug';
import { initializeListeners } from '@/device/listeners';
import { checkForUpdates, openStore } from '@/device/updates';
import { useNotification } from '@/hooks/useNotification';
import { APP_CONFIG } from '@/shared/config';
import { COLORS, SIZE } from '@/shared/constants';
import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { shouldShowWhatsNew, WHATS_NEW } from '@/shared/whatsNew';
import { refreshNotifications, registerBackgroundTask } from '@/stores/notifications';
import { syncLoadable } from '@/stores/sync';
import {
  popupUpdateEnabledAtom,
  popupWhatsNewEnabledAtom,
  setPopupUpdateEnabled,
  setPopupWhatsNewEnabled,
} from '@/stores/ui';
import { getInstalledVersion, getWhatsNewShownVersion, setWhatsNewShownVersion } from '@/stores/version';

export default function Index() {
  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);
  const whatsNewVisible = useAtomValue(popupWhatsNewEnabledAtom);
  const installedVersion = getInstalledVersion();

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only initialization — checkInitialPermissions is a per-render function, intentionally captured once; re-adding it would re-register listeners on every render
  useEffect(() => {
    // Initialize notifications, register background task, and create channel on first load
    initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask).catch((error) =>
      logger.error('Failed to initialize notifications:', error)
    );

    // Initialize background/foreground state listeners (sync UI as needed)
    initializeListeners(checkInitialPermissions);

    // Debug instrumentation for the notification-refresh background task (ISSUES.md #8)
    runBackgroundTaskDebugSequence();

    // Check for updates in background
    checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate));

    // Show the What's New modal once after an update (never on fresh installs -
    // stores/version.ts seeds the shown-version for new users). Marking shown
    // on display (not dismiss) makes a mid-display crash unable to re-loop it
    if (shouldShowWhatsNew(installedVersion, getWhatsNewShownVersion(), WHATS_NEW)) {
      setWhatsNewShownVersion(installedVersion);
      setPopupWhatsNewEnabled(true);
    } else if (__DEV__ && APP_CONFIG.whatsNewPreview) {
      setPopupWhatsNewEnabled(true);
    }
  }, []);

  // Hide splash screen once sync completes
  useEffect(() => {
    if (state !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [state]);

  const handleCloseUpdate = () => {
    setPopupUpdateEnabled(false);
  };

  const handleUpdate = () => {
    openStore();
    setPopupUpdateEnabled(false);
  };

  const handleContinueWhatsNew = () => {
    setPopupWhatsNewEnabled(false);
  };

  if (state === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      </View>
    );
  }
  if (state === 'hasError') return <ErrorScreen />;

  return (
    <>
      {WHATS_NEW ? (
        <ModalWhatsNew
          visible={whatsNewVisible}
          version={installedVersion}
          items={WHATS_NEW.items}
          onContinue={handleContinueWhatsNew}
        />
      ) : null}
      {/* Gated so the nag never stacks on top of the What's New modal */}
      <ModalUpdate visible={updateAvailable && !whatsNewVisible} onClose={handleCloseUpdate} onUpdate={handleUpdate} />
      <Navigation />
      <Overlay />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

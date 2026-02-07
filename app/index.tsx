import * as SplashScreen from 'expo-splash-screen';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Navigation from '@/app/Navigation';
import { ModalUpdate } from '@/components/modals';
import { Overlay } from '@/components/overlay';
import { Error } from '@/components/ui';
import { initializeListeners } from '@/device/listeners';
import { checkForUpdates, openStore } from '@/device/updates';
import { useNotification } from '@/hooks/useNotification';
import { COLORS, SIZE } from '@/shared/constants';
import logger from '@/shared/logger';
import { initializeNotifications } from '@/shared/notifications';
import { refreshNotifications, registerBackgroundTask } from '@/stores/notifications';
import { syncLoadable } from '@/stores/sync';
import { popupUpdateEnabledAtom, setPopupUpdateEnabled } from '@/stores/ui';

export default function Index() {
  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);

  useEffect(() => {
    // Initialize notifications, register background task, and create channel on first load
    initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask).catch((error) =>
      logger.error('Failed to initialize notifications:', error)
    );

    // Initialize background/foreground state listeners (sync UI as needed)
    initializeListeners(checkInitialPermissions);

    // Check for updates in background
    checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate));
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

  if (state === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={SIZE.activityIndicator} color={COLORS.navigation.activityIndicator} />
      </View>
    );
  }
  if (state === 'hasError') return <Error />;

  return (
    <>
      <ModalUpdate visible={updateAvailable} onClose={handleCloseUpdate} onUpdate={handleUpdate} />
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

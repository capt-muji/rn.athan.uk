import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';

import Navigation from '@/app/Navigation';
import Error from '@/components/Error';
import ModalTimesExplained from '@/components/ModalTimesExplained';
import ModalTips from '@/components/ModalTips';
import ModalUpdate from '@/components/ModalUpdate';
import Overlay from '@/components/Overlay';
import { initializeListeners } from '@/device/listeners';
import { registerBackgroundFetchAsync } from '@/device/tasks';
import { checkForUpdates, openStore } from '@/device/updates';
import { useNotification } from '@/hooks/useNotification';
import logger from '@/shared/logger';
import { createDefaultAndroidChannel } from '@/shared/notifications';
import { syncLoadable } from '@/stores/sync';
import {
  popupTipAthanEnabledAtom,
  setPopupTipAthanEnabled,
  popupUpdateEnabledAtom,
  setPopupUpdateEnabled,
  popupTimesExplainedAtom,
  setPopupTimesExplained,
} from '@/stores/ui';

export default function Index() {
  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  const modalTipEnabled = useAtomValue(popupTipAthanEnabledAtom);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);
  const modalTimesExplained = useAtomValue(popupTimesExplainedAtom);

  useEffect(() => {
    // Create default Android channel in background (does not depend on permissions)
    createDefaultAndroidChannel();

    // Check permissions for notifications and register background fetch if allowed
    checkInitialPermissions().then((hasPermission) => {
      if (hasPermission) registerBackgroundFetchAsync();
      else logger.info('TASK: Notifications permission not granted.');
    });

    // Initialize background/foreground state listeners (sync UI as needed)
    initializeListeners();

    // Check for updates in background
    checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate));
  }, []);

  const handleCloseTip = () => {
    setPopupTipAthanEnabled(false);
  };

  const handleCloseUpdate = () => {
    setPopupUpdateEnabled(false);
  };

  const handleUpdate = () => {
    openStore();
    setPopupUpdateEnabled(false);
  };

  const handleCloseTimesExplained = () => {
    setPopupTimesExplained(2);
  };

  if (state === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={Platform.select({ ios: 48, android: 32 })} color="#8d73ff" />
      </View>
    );
  }
  if (state === 'hasError') return <Error />;

  return (
    <>
      <ModalUpdate visible={updateAvailable} onClose={handleCloseUpdate} onUpdate={handleUpdate} />
      <ModalTips visible={modalTipEnabled} onClose={handleCloseTip} />
      <ModalTimesExplained visible={modalTimesExplained === 1} onClose={handleCloseTimesExplained} />
      <Overlay />
      <Navigation />
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

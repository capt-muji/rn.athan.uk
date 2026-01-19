import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';

import Navigation from '@/app/Navigation';
import Error from '@/components/Error';
import ModalTips from '@/components/ModalTips';
import ModalUpdate from '@/components/ModalUpdate';
import Overlay from '@/components/Overlay';
import { initializeListeners } from '@/device/listeners';
import { openStore } from '@/device/updates';
import { useNotification } from '@/hooks/useNotification';
import { initializeNotifications } from '@/shared/notifications';
import { refreshNotifications } from '@/stores/notifications';
import { syncLoadable } from '@/stores/sync';
import {
  popupTipAthanEnabledAtom,
  setPopupTipAthanEnabled,
  popupUpdateEnabledAtom,
  setPopupUpdateEnabled,
} from '@/stores/ui';

export default function Index() {
  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  const modalTipEnabled = useAtomValue(popupTipAthanEnabledAtom);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);

  useEffect(() => {
    // Initialize notifications and create channel on first load
    initializeNotifications(checkInitialPermissions, refreshNotifications);

    // Initialize background/foreground state listeners (sync UI as needed)
    initializeListeners(checkInitialPermissions);

    // Check for updates in background (currently disabled - github raw URL changed)
    // checkForUpdates().then((hasUpdate) => setPopupUpdateEnabled(hasUpdate));
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

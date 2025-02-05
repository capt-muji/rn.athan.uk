import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import ModalTimesExplained from '@/components/ModalTimesExplained';
import ModalTips from '@/components/ModalTips';
import ModalUpdate from '@/components/ModalUpdate';
import Overlay from '@/components/Overlay';
import { initializeListeners } from '@/device/listeners';
import { checkForUpdates, openStore } from '@/device/updates';
import { useNotification } from '@/hooks/useNotification';
import { initializeNotifications } from '@/shared/notifications';
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
  useFonts({ Roboto: FontRoboto, 'Roboto-Medium': FontRobotoMedium });

  const { checkInitialPermissions } = useNotification();
  const { state } = useAtomValue(syncLoadable);
  const modalTipEnabled = useAtomValue(popupTipAthanEnabledAtom);
  const updateAvailable = useAtomValue(popupUpdateEnabledAtom);
  const modalTimesExplained = useAtomValue(popupTimesExplainedAtom);

  useEffect(() => {
    // Initialize notifications on first load
    initializeNotifications(checkInitialPermissions);

    // Initialize background/foreground state listeners
    initializeListeners(checkInitialPermissions);

    // Check for updates in background
    checkForUpdates().then((hasUpdate) => {
      setPopupUpdateEnabled(hasUpdate);
    });
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

  if (state === 'loading') return <WaveIndicator color="white" />;
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

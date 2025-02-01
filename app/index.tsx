import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import ModalTips from '@/components/ModalTips';
import Overlay from '@/components/Overlay';
import { initializeListeners } from '@/device/listeners';
import { useNotification } from '@/hooks/useNotification';
import { initializeNotifications } from '@/shared/notifications';
import { syncLoadable } from '@/stores/sync';
import { popupTipAthanEnabledAtom, setPopupTipAthanEnabled } from '@/stores/ui';

export default function Index() {
  useFonts({ Roboto: FontRoboto, 'Roboto-Medium': FontRobotoMedium });

  const { state } = useAtomValue(syncLoadable);
  const { checkInitialPermissions } = useNotification();
  const modalTipEnabled = useAtomValue(popupTipAthanEnabledAtom);

  useEffect(() => {
    // Initialize notifications on first load
    initializeNotifications(checkInitialPermissions);
    // Initialize background/foreground state listeners
    initializeListeners(checkInitialPermissions);

    // disable update check for now
    // checkForUpdates();
  }, []);

  const handleCloseTip = () => {
    setPopupTipAthanEnabled(false);
  };

  if (state === 'loading') return <WaveIndicator color="white" />;
  if (state === 'hasError') return <Error />;

  return (
    <>
      <ModalTips visible={modalTipEnabled} onClose={handleCloseTip} />
      <Overlay />
      <Navigation />
    </>
  );
}

import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import Overlay from '@/components/Overlay';
import { useNotification } from '@/hooks/useNotification';
import * as Database from '@/stores/database';
import { syncLoadable } from '@/stores/sync';

// TODO: Remove below check
Database.cleanup();
// TODO: Remove above check

export default function Index() {
  const { state } = useAtomValue(syncLoadable);
  const [fontsLoaded] = useFonts({ Roboto: FontRoboto, 'Roboto-Medium': FontRobotoMedium });
  const { checkInitialPermissions } = useNotification();

  checkInitialPermissions();

  if (!fontsLoaded || state === 'loading') return <WaveIndicator color="white" />;
  if (state === 'hasError') return <Error />;

  return (
    <>
      <Overlay />
      <Navigation />
    </>
  );
}

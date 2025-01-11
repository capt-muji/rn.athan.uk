import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import Overlay from '@/components/Overlay';
import { useNotification } from '@/hooks/useNotification';
import { PRAYERS_ENGLISH } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { createPrayerAlertAtom } from '@/stores/notifications';
import { syncLoadable } from '@/stores/sync';

export default function Index() {
  console.log('STEPxxxxx 111111111');
  // TODO: Remove below check
  Database.cleanup();
  // TODO: Remove above check

  PRAYERS_ENGLISH.map((_, index) => createPrayerAlertAtom(ScheduleType.Standard, index));
  // ! TESTS ABOVE

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

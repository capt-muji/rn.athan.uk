import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import Overlay from '@/components/Overlay';
import { fetchAndSaveDataLoadable, updateSchedulesAndDate } from '@/stores/sync';

export default function Index() {
  const { state } = useAtomValue(fetchAndSaveDataLoadable);
  const [fontsLoaded] = useFonts({ Roboto: FontRoboto, 'Roboto-Medium': FontRobotoMedium });

  if (!fontsLoaded || state === 'loading') return <WaveIndicator color="white" />;
  if (state === 'hasError') return <Error />;

  updateSchedulesAndDate();

  return (
    <>
      <Overlay />
      <Navigation />
    </>
  );
}

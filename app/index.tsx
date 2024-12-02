import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WaveIndicator } from 'react-native-indicators';

import Layout from '@/app/Layout';
import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import Overlay from '@/components/Overlay';
import { fetchAndSaveDataLoadable, updateSchedulesAndDate } from '@/stores/sync';

export default function Index() {
  const { state } = useAtomValue(fetchAndSaveDataLoadable);
  const [fontsLoaded] = useFonts({ Roboto: FontRoboto, 'Roboto-Medium': FontRobotoMedium });

  if (!fontsLoaded || state === 'loading') {
    return (
      <Layout>
        <WaveIndicator color="white" />
      </Layout>
    );
  }

  if (state === 'hasError') {
    return (
      <Layout>
        <Error />
      </Layout>
    );
  }

  updateSchedulesAndDate();

  return (
    <Layout>
      <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
        <Navigation />
        <Overlay />
      </GestureHandlerRootView>
    </Layout>
  );
}

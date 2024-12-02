import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Error from '@/components/Error';
import GradientBackground from '@/components/GradientBackground';
import Overlay from '@/components/Overlay';
import { initialiseLoadable } from '@/stores/sync';

export default function Index() {
  const init = useAtomValue(initialiseLoadable);

  const [fontsLoaded] = useFonts({
    Roboto: FontRoboto,
    'Roboto-Medium': FontRobotoMedium,
  });

  if (!fontsLoaded || init.state === 'loading') return <WaveIndicator color="white" />;
  if (init.state === 'hasError') return <Error />;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <Navigation />
      <Overlay />
    </GestureHandlerRootView>
  );
}

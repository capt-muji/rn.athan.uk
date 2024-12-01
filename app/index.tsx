import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { StyleSheet, StatusBar, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WaveIndicator } from 'react-native-indicators';

import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import GradientBackground from '@/components/GradientBackground';
import Overlay from '@/components/Overlay';
import { initializationLoadable } from '@/stores/store';

export default function Index() {
  const init = useAtomValue(initializationLoadable);

  const [fontsLoaded] = useFonts({
    Roboto: FontRoboto,
    'Roboto-Medium': FontRobotoMedium,
  });

  if (!fontsLoaded || init.state === 'loading') {
    return <WaveIndicator color="white" />;
  }

  if (init.state === 'hasError') {
    return <Text>ERROR</Text>;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <Navigation />
      <Overlay />
    </GestureHandlerRootView>
  );
}

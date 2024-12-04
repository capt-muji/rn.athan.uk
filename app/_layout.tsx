import { Slot } from 'expo-router';
import { StatusBar } from 'react-native';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GradientBackground from '@/components/GradientBackground';

// TODO: Remove this once the issues are fixed
LogBox.ignoreLogs(['Require cycle', 'SplashScreen.show']);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <Slot />
    </GestureHandlerRootView>
  );
}

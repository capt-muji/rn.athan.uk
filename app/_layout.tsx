import { Slot } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GradientBackground from '@/components/GradientBackground';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <Slot />
    </GestureHandlerRootView>
  );
}

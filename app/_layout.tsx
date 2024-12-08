import { Slot } from 'expo-router';
import { StatusBar } from 'react-native';
import { LogBox } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ActionSheetSound from '@/components/ActionSheetSound';
import GradientBackground from '@/components/GradientBackground';

// TODO: Remove this once the issues are fixed
LogBox.ignoreLogs(['Require cycle', 'SplashScreen.show']);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <SheetProvider>
        <Slot />
        <ActionSheetSound />
      </SheetProvider>
    </GestureHandlerRootView>
  );
}

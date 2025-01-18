import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import { LogBox } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheetSound from '@/components/BottomSheetSound';
import GradientBackground from '@/components/GradientBackground';

// TODO: Remove this once the issues are fixed
LogBox.ignoreLogs(['Require cycle', 'SplashScreen.show']);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground />
      <SystemBars style="light" />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

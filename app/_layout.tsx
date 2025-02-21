import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheetSound from '@/components/BottomSheetSound';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Ignore logs
LogBox.ignoreLogs(['Require cycle']);

export default function Layout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#2c1c77' }}>
      <SystemBars style="light" />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

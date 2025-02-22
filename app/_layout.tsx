import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useLayoutEffect } from 'react';
import { LogBox, Text } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheetSound from '@/components/BottomSheetSound';
import InitialWidthMeasurement from '@/components/InitialWidthMeasurement';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Ignore logs
LogBox.ignoreLogs(['Require cycle']);

// Set default props for all Text components
// @ts-expect-error silent
Text.defaultProps = {
  // @ts-expect-error silent
  ...Text.defaultProps,
  allowFontScaling: false,
};

export default function Layout() {
  useLayoutEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#2c1c77' }}>
      <SystemBars style="light" />
      <InitialWidthMeasurement />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

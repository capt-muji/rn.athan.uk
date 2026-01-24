import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect } from 'react';
import { LogBox, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import BottomSheetSettings from '@/components/BottomSheetSettings';
import BottomSheetSound from '@/components/BottomSheetSound';
import InitialWidthMeasurement from '@/components/InitialWidthMeasurement';
import { COLORS } from '@/shared/constants';
import { triggerSyncLoadable } from '@/stores/sync';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Call API During App Start in background
setTimeout(triggerSyncLoadable, 0);

// Ignore logs
LogBox.ignoreLogs(['Require cycle']);

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Disable font scaling for all text components (prevents system font size from breaking layout)
// @ts-expect-error defaultProps is deprecated but still works for this use case
Text.defaultProps = {
  // @ts-expect-error defaultProps is deprecated but still works for this use case
  ...Text.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

export default function Layout() {
  useLayoutEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navigation.rootBackground }}>
      <StatusBar style="light" translucent />
      <InitialWidthMeasurement />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
        <BottomSheetSettings />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

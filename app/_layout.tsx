// IMPORTANT: Import background task definition FIRST to ensure it's registered in global scope
// before any other code runs. This allows the OS to find the task even when waking a killed app.
import '@/device/tasks';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, Text, View } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheetAlert, BottomSheetSettings, BottomSheetSound } from '@/components/sheets';
import { InitialWidthMeasurement } from '@/components/ui';
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

function NavigationBarBackground() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: insets.bottom,
        backgroundColor: '#000000',
      }}
    />
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navigation.rootBackground }}>
        <SystemBars style="light" hidden={{ statusBar: false, navigationBar: false }} />
        <InitialWidthMeasurement />
        <BottomSheetModalProvider>
          <Slot />
          <BottomSheetSound />
          <BottomSheetSettings />
          <BottomSheetAlert />
        </BottomSheetModalProvider>
        <NavigationBarBackground />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

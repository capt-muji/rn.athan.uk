// IMPORTANT: Import background task definition FIRST to ensure it's registered in global scope
// before any other code runs. This allows the OS to find the task even when waking a killed app.
import '@/device/tasks';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { setAudioModeAsync } from 'expo-audio';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { BottomSheetAlert, BottomSheetSettings, BottomSheetSound } from '@/components/sheets';
import { InitialWidthMeasurement } from '@/components/ui';
import { COLORS } from '@/shared/constants';
import logger from '@/shared/logger';
import { triggerSyncLoadable } from '@/stores/sync';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Call API During App Start in background
setTimeout(triggerSyncLoadable, 0);

// Athan sound previews must be audible regardless of the ring/silent switch:
// until a mode is set explicitly, the app runs on iOS's default session
// category (.soloAmbient), which the mute switch silences — expo-audio
// configures nothing on its own (AudioModule.swift only touches the session
// inside setAudioModeAsync). mixWithOthers stays the interruption mode, so
// previews never steal focus from background audio.
setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
  logger.warn('AUDIO: Failed to set audio mode', { error });
});

// Ignore logs
LogBox.ignoreLogs(['Require cycle']);

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Global Text font-scaling defaults live in jsx-runtime-shim.ts (wired via
// metro.config.js): React 19 removed defaultProps for function components, which
// made the previous Text.defaultProps mutation inert on RN 0.86.

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navigation.rootBackground }}>
      <SystemBars style='light' hidden={{ navigationBar: false }} />
      <InitialWidthMeasurement />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
        <BottomSheetSettings />
        <BottomSheetAlert />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

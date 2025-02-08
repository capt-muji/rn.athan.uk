/* eslint-disable @typescript-eslint/no-require-imports */

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheetSound from '@/components/BottomSheetSound';
import Error from '@/components/Error';
import GradientBackground from '@/components/GradientBackground';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

// Ignore logs
LogBox.ignoreLogs(['Require cycle', 'SplashScreen']);

export default function Layout() {
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Roboto: require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();
    setIsReady(true);
  }, [fontsLoaded]);

  if (fontError) return <Error />;
  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#2c1c77' }}>
      <GradientBackground />
      <SystemBars style="light" />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetSound />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

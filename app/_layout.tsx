import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheetSound from '@/components/BottomSheetSound';
import GradientBackground from '@/components/GradientBackground';

// Prevent splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(['Require cycle']);

export default function Layout() {
  // const [fontsLoaded, fontError] = useFonts({
  //   Roboto: require('@/assets/fonts/Roboto-Regular.ttf'),
  //   'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf'),
  // });

  // useEffect(() => {
  //   if (fontsLoaded) {
  //     // Temporary delay for testing splash screen
  //     const timeout = setTimeout(() => {
  //       console.log('xxxxxLayout hide splash screen');
  //       SplashScreen.hideAsync();

  //       console.log(SplashScreen);
  //     }, 3000);

  //     return () => clearTimeout(timeout);
  //   }
  // }, [fontsLoaded]);

  // if (fontError) return <Error />;
  if (true) return null;

  console.log('xxxxxLayout rendered');

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

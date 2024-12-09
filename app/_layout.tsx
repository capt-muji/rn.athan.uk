import { BottomSheetModalProvider, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Slot } from 'expo-router';
import { StatusBar, Text, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GradientBackground from '@/components/GradientBackground';
import { setBottomSheetModal } from '@/stores/ui';

// TODO: Remove this once the issues are fixed
LogBox.ignoreLogs(['Require cycle', 'SplashScreen.show']);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <BottomSheetModalProvider>
        <Slot />
        <BottomSheetModal ref={(ref) => setBottomSheetModal(ref)} snapPoints={['25%']}>
          <BottomSheetView>
            <Text>Awesome 🎉</Text>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

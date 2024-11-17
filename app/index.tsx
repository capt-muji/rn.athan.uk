import { useEffect, useState } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtom } from 'jotai';
import { useFonts } from 'expo-font';
import { WaveIndicator } from 'react-native-indicators';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { isLoadingAtom, hasErrorAtom } from '@/stores/store';
import { MOCK_DATA_SIMPLE } from '@/mocks/data';
import { useInit } from '@/hooks/useInit';
import { COLORS, OVERLAY } from '@/constants';
import Navigation from './Navigation';

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    'Roboto': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf')
  });

  const { initialize } = useInit();

  useEffect(() => {
    const init = async () => {
      await initialize({ ...MOCK_DATA_SIMPLE });
      setIsInitialized(true);
    };
    init();
  }, []);

  if (!fontsLoaded || !isInitialized) return <WaveIndicator color="white" />;

  return (
    <>
      <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={[StyleSheet.absoluteFillObject, { zIndex: OVERLAY.zindexes.background }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <StatusBar barStyle="light-content" />
        <Navigation />
      </GestureHandlerRootView>
    </>
  );
};
import { useEffect, useState } from 'react';
import { StyleSheet, StatusBar, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtom } from 'jotai';
import { useFonts } from 'expo-font';
import { WaveIndicator } from 'react-native-indicators';
import { router } from 'expo-router';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import Main from '@/components/Main';
import Error from '@/components/Error';
import { isLoadingAtom, hasErrorAtom } from '@/store/store';
import { MOCK_DATA_SIMPLE } from '@/mocks/data';
import { useInit } from '@/hooks/useInit';
import { COLORS, OVERLAY } from '@/constants';

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    'Roboto': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf')
  });

  const [isLoading] = useAtom(isLoadingAtom);
  const [hasError] = useAtom(hasErrorAtom);

  const { initialize } = useInit();

  const swipeGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      'worklet';
      runOnJS(router.push)('/extras');
    });

  useEffect(() => {
    const init = async () => {
      await initialize({ ...MOCK_DATA_SIMPLE });
      setIsInitialized(true);
    };
    init();
  }, []);

  if (!fontsLoaded || !isInitialized) return <WaveIndicator color="white" />;

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <StatusBar barStyle="light-content" />
        {isLoading && <WaveIndicator color="white" />}
        {hasError && !isLoading && <Error />}
        {!hasError && !isLoading && <Main />}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY.zindexes.background
  }
});

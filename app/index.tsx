import React, { useEffect } from 'react';
import { StyleSheet, StatusBar, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtom } from 'jotai';
import * as Haptics from 'expo-haptics';

import { COLORS } from '../constants';
import Main from '../components/Main';
import Error from '../components/Error';
import { isLoadingAtom, hasErrorAtom, todaysPrayersAtom, overlayVisibleAtom } from '@/store';
// @ts-ignore
import { WaveIndicator } from 'react-native-indicators';
import { init } from '../controllers';

export default function Index() {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [hasError, setHasError] = useAtom(hasErrorAtom);
  const [, setTodaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible, setOverlayVisible] = useAtom(overlayVisibleAtom);

  const removeOverlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverlayVisible(-1);
  };

  useEffect(() => {
    init(setIsLoading, setHasError, setTodaysPrayers);
  }, []);


  return (
    <>
      {overlayVisible !== -1 && (
        <Pressable style={styles.overlay} onPress={removeOverlay} />
      )}

      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
      />
      <StatusBar barStyle="light-content" />

      {isLoading && <WaveIndicator color="white" />}
      {hasError && <Error />}
      {!hasError && !isLoading && <Main />}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

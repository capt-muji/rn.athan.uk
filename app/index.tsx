import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtom } from 'jotai';

import { COLORS } from '../constants';
import Main from '../components/Main';
import Error from '../components/Error';
import { isLoadingAtom, hasErrorAtom, todaysPrayersAtom } from '@/store';
// @ts-ignore
import { WaveIndicator } from 'react-native-indicators';
import { init } from '../controllers';

export default function Index() {
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [hasError, setHasError] = useAtom(hasErrorAtom);
  const [, setTodaysPrayers] = useAtom(todaysPrayersAtom);

  useEffect(() => {
    init(setIsLoading, setHasError, setTodaysPrayers);
  }, []);

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.gradient}
    >
      {/* <View style={styles.overlay} /> */}

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {hasError && <Error />}
        {isLoading && <WaveIndicator color={'white'} />}
        {!hasError && !isLoading && <Main />}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    margin: 15,
    marginTop: 60,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1,
  },
});

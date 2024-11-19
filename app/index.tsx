import { useEffect } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { WaveIndicator } from 'react-native-indicators';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useApp } from '@/hooks/useApp';
import { COLORS, OVERLAY } from '@/shared/constants';
import Navigation from '@/app/Navigation';
import RadialGlow from '@/components/RadialGlow';
import * as prayerUtils from '@/shared/prayer';
import * as database from '@/stores/database';
import * as Data from '@/mocks/data_simple';

export default function Index() {
  // const { initialize, isLoading } = useApp();

  const [fontsLoaded] = useFonts({
    'Roboto': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf')
  });

  useEffect(() => {
    console.log('EEE1111');
    const dataFiltered = prayerUtils.filterApiData(Data.MOCK_DATA_SIMPLE);
    const dataTransformed = prayerUtils.transformApiData(dataFiltered);

    database.saveAll(dataTransformed);


    // const init = async () => {
    //   // await initialize();
    // };
    // init();
  }, []);

  if (!fontsLoaded) return <WaveIndicator color="white" />;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[StyleSheet.absoluteFillObject, { zIndex: OVERLAY.zindexes.background }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <StatusBar barStyle="light-content" />
      <RadialGlow />
      {/* <Navigation /> */}
    </GestureHandlerRootView>
  );
};
import { useEffect } from 'react';
import { StyleSheet, StatusBar, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { WaveIndicator } from 'react-native-indicators';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAtomValue } from 'jotai';

import { standardScheduleAtom } from '@/stores/store_jotai';
import { setSchedule } from '@/stores/utils_jotai';
import { useApp } from '@/hooks/useApp';
import { COLORS, OVERLAY } from '@/shared/constants';
import Navigation from '@/app/Navigation';
import RadialGlow from '@/components/RadialGlow';
import * as prayerUtils from '@/shared/prayer';
import * as Database from '@/stores/database';
import * as Data from '@/mocks/data_simple';
import * as Api from '@/api/client';
import { ScheduleType } from '@/shared/types';

export default function Index() {
  const standardSchedule = useAtomValue(standardScheduleAtom);

  const [fontsLoaded] = useFonts({
    'Roboto': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf')
  });

  useEffect(() => {
    const init = async () => {
      const data = await Api.process();
      Database.saveAll(data);

      setSchedule(ScheduleType.Standard);
      setSchedule(ScheduleType.Extra);
    };
    init();
  }, []);

  useEffect(() => {
    console.log('Schedule updated:', standardSchedule);
  }, [standardSchedule]);

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
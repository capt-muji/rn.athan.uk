import { useEffect } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { WaveIndicator } from 'react-native-indicators';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setSchedule, setDate } from '@/stores/actions';
import Navigation from '@/app/Navigation';
import RadialGlow from '@/components/RadialGlow';
import * as Database from '@/stores/database';
import * as Api from '@/api/client';
import { ScheduleType } from '@/shared/types';
import GradientBackground from '@/components/GradientBackground';

export default function Index() {
  const [fontsLoaded] = useFonts({
    'Roboto': require('@/assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('@/assets/fonts/Roboto-Medium.ttf')
  });

  useEffect(() => {
    const init = async () => {
      try {
        const data = await Api.handle();
        Database.saveAll(data);

        setSchedule(ScheduleType.Standard);
        setSchedule(ScheduleType.Extra);
        setDate();
      } catch (error) {
        console.error('Init failed:', error);
      }
    };
    init();
  }, []);

  if (!fontsLoaded) return <WaveIndicator color="white" />;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <RadialGlow />
      <Navigation />
    </GestureHandlerRootView>
  );
}
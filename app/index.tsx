import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WaveIndicator } from 'react-native-indicators';

import * as Api from '@/api/client';
import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import Glow from '@/components/Glow';
import GradientBackground from '@/components/GradientBackground';
import logger from '@/shared/logger';
import { ScheduleType } from '@/shared/types';
import { setSchedule, setDate } from '@/stores/actions';
import * as Database from '@/stores/database';

export default function Index() {
  const [fontsLoaded] = useFonts({
    Roboto: FontRoboto,
    'Roboto-Medium': FontRobotoMedium,
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
        logger.error('Init failed:', error);
      }
    };
    init();
  }, []);

  if (!fontsLoaded) return <WaveIndicator color="white" />;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      <Glow />
      <Navigation />
    </GestureHandlerRootView>
  );
}

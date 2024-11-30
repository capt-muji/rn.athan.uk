import { useFonts } from 'expo-font';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, StatusBar, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WaveIndicator } from 'react-native-indicators';

import * as Api from '@/api/client';
import Navigation from '@/app/Navigation';
import FontRobotoMedium from '@/assets/fonts/Roboto-Medium.ttf';
import FontRoboto from '@/assets/fonts/Roboto-Regular.ttf';
import GradientBackground from '@/components/GradientBackground';
import Overlay from '@/components/Overlay';
import logger from '@/shared/logger';
import { ScheduleType } from '@/shared/types';
import { setSchedule, setDate, setIsLoading, setHasError } from '@/stores/actions';
import * as Database from '@/stores/database';
import { appAtom, measurementsAtom } from '@/stores/store';

export default function Index() {
  const app = useAtomValue(appAtom);
  const measurements = useAtomValue(measurementsAtom);

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

        setIsLoading(false);
      } catch (error) {
        logger.error('Init failed:', error);

        setIsLoading(false);
        setHasError(true);
      }
    };
    init();
  }, []);

  if (!fontsLoaded) return <WaveIndicator color="white" />;
  if (app.isLoading) return <WaveIndicator color="white" />;
  if (app.hasError) return <Text>ERROR</Text>;

  const measurementsReady = measurements.date !== null && measurements.list !== null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      {measurementsReady && <Overlay />}
      <Navigation />
    </GestureHandlerRootView>
  );
}

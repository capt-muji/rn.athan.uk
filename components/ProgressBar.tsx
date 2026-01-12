import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { useSchedule } from '@/hooks/useSchedule';
import * as PrayerUtils from '@/shared/prayer';
import { createLondonDate } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import * as Database from '@/stores/database';
import { overlayAtom } from '@/stores/overlay';
import { standardTimerAtom, extraTimerAtom, overlayTimerAtom } from '@/stores/timer';

interface Props {
  type: ScheduleType;
}

export default function ProgressBar({ type }: Props) {
  const { schedule } = useSchedule(type);
  const overlay = useAtomValue(overlayAtom);

  // Get timer from store based on type
  const isStandard = type === ScheduleType.Standard;
  const timerAtom = overlay.isOn ? overlayTimerAtom : isStandard ? standardTimerAtom : extraTimerAtom;
  const timer = useAtomValue(timerAtom);

  const progress = useMemo(() => {
    const nextPrayer = schedule.today[schedule.nextIndex];
    let prevPrayer;

    // Special case: First prayer (Fajr) - use yesterday's last prayer (Isha)
    if (schedule.nextIndex === 0) {
      const yesterday = createLondonDate();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayData = Database.getPrayerByDate(yesterday);

      if (!yesterdayData) return null;

      const yesterdaySchedule = PrayerUtils.createSchedule(yesterdayData, type);
      const lastIndex = Object.keys(yesterdaySchedule).length - 1;

      prevPrayer = yesterdaySchedule[lastIndex];
    } else {
      prevPrayer = schedule.today[schedule.nextIndex - 1];
    }

    const parseTimeToSeconds = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 3600 + minutes * 60;
    };

    const prevPrayerTimeInSeconds = parseTimeToSeconds(prevPrayer.time);
    const nextPrayerTimeInSeconds = parseTimeToSeconds(nextPrayer.time);

    const timeDiffInSeconds = nextPrayerTimeInSeconds - prevPrayerTimeInSeconds;
    const totalDuration = timeDiffInSeconds >= 0 ? timeDiffInSeconds : 86400 + timeDiffInSeconds;

    return Math.max(0, Math.min(100, (timer.timeLeft / totalDuration) * 100));
  }, [schedule, timer.timeLeft, type]);

  const widthValue = useSharedValue(progress ?? 0);
  const isFirstRender = useRef(true);
  const prevProgress = useRef(progress);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthValue.value}%`,
  }));

  useEffect(() => {
    if (progress !== null) {
      if (isFirstRender.current) {
        widthValue.value = progress;
        isFirstRender.current = false;
      } else {
        const progressDiff = Math.abs((progress ?? 0) - (prevProgress.current ?? 0));
        if (progressDiff > 50) {
          widthValue.value = withTiming(progress, { duration: 950, easing: Easing.bezier(0.33, 0, 0.1, 1) });
        } else {
          widthValue.value = withTiming(progress, { duration: 1000, easing: Easing.linear });
        }
      }
      prevProgress.current = progress;
    }
  }, [progress]);

  // Hide when overlay is on (after all hooks are called)
  if (overlay.isOn || progress === null) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.elapsed, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 3,
    width: 100,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#dff9ff25',
    overflow: 'hidden',
  },
  elapsed: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#d3ff8b',
  },
});

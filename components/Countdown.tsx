import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { COLORS, TEXT } from '@/shared/constants';
import { formatTime, getDateTodayOrTomorrow, getTimeDifference } from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';
import { extraScheduleAtom, incrementNextIndex, standardScheduleAtom } from '@/stores/schedule';
import { overlayAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Countdown({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const { today, nextIndex } = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  const overlay = useAtomValue(overlayAtom);

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const prayer = today[nextIndex];
    const prayerDate = getDateTodayOrTomorrow(DaySelection.Today);

    const updateCountdown = () => {
      const diff = getTimeDifference(prayer.time, prayerDate);

      if (diff <= 0) incrementNextIndex(type);
      setCountdown(formatTime(diff));
    };

    // Update countdown every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [nextIndex]);

  const countdownName = today[nextIndex]?.english;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{countdownName || ''} in</Text>
      <Animated.Text style={[styles.countdown, animatedStyle]}>{countdown || ' '}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 5,
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
  },
  countdown: {
    fontFamily: TEXT.famiy.regular,
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
});

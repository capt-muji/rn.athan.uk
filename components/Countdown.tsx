import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { usePrayer } from '@/hooks/usePrayer';
import { COLORS, TEXT } from '@/shared/constants';
import { formatTime, getDateTodayOrTomorrow, getTimeDifference } from '@/shared/time';
import { DaySelection, ScheduleType } from '@/shared/types';
import { incrementNextIndex } from '@/stores/schedule';
import { overlayAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Countdown({ type }: Props) {
  const { schedule } = usePrayer(0, type);
  const overlay = useAtomValue(overlayAtom);

  // Derived State
  const prayer = schedule.today[schedule.nextIndex];
  const prayerDate = getDateTodayOrTomorrow(DaySelection.Today);
  const initialTime = formatTime(getTimeDifference(prayer.time, prayerDate));
  const countdownName = schedule.today[schedule.nextIndex].english;

  // State
  const [countdown, setCountdown] = useState(initialTime);

  // Animations
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  // Functions
  const updateCountdown = () => {
    const diff = getTimeDifference(prayer.time, prayerDate);
    if (diff <= 500) incrementNextIndex(type);
    setCountdown(formatTime(diff));
  };

  // Effects
  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{countdownName} in</Text>
      <Animated.Text style={[styles.countdown, animatedStyle]}>{countdown}</Animated.Text>
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

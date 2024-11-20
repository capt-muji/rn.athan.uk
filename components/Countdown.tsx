import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, OVERLAY, TEXT } from '@/shared/constants';
import { DaySelection, ScheduleType } from '@/shared/types';
import { useAtomValue } from 'jotai';
import { extraScheduleAtom, standardScheduleAtom, overlayAtom } from '@/stores/store';
import { useEffect, useState } from 'react';
import { formatTime, getRecentDate, getTimeDifference } from '@/shared/time';
import { incrementNextIndex } from '@/stores/actions';

interface Props { type: ScheduleType }

export default function Countdown({ type }: Props) {
  const { today, nextIndex } = useAtomValue(type === ScheduleType.Standard ? standardScheduleAtom : extraScheduleAtom);
  const overlay = useAtomValue(overlayAtom);

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const prayer = today[nextIndex];
      const diff = getTimeDifference(prayer.time, getRecentDate(DaySelection.Today));

      if (diff <= 1000) incrementNextIndex(type);
      setCountdown(formatTime(diff));
    };

    // Update countdown every second
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [nextIndex]);

  const countdownName = today[nextIndex]?.english;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(overlay.isOn ? 1.5 : 1) },
      { translateY: withTiming(overlay.isOn ? 5 : 0) }
    ]
  }));

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{countdownName || ''} in</Text>
      <Animated.Text
        style={[
          styles.countdown,
          { fontFamily: overlay.isOn ? TEXT.famiy.medium : TEXT.famiy.regular },
          animatedStyle
        ]}
      >
        {countdown || ' '}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    justifyContent: 'center',
    zIndex: OVERLAY.zindexes.off.countdown,
    pointerEvents: 'none',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 5,
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity
  },
  countdown: {
    fontFamily: TEXT.famiy.medium,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
});

import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useCountdown } from '@/hooks/useCountdown';
import { COLORS, SPACING, STYLES, TEXT } from '@/shared/constants';
import type { ScheduleType } from '@/shared/types';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';
import { countdownBarShownAtom } from '@/stores/ui';

import Bar from './Bar';

interface Props {
  type: ScheduleType;
}

export default function Countdown({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  // See: ai/adr/005-timing-system-overhaul.md
  //
  // While the overlay is open on this schedule the page countdown atom itself
  // carries the selected prayer's countdown (ADR-014 countdown merge — the
  // sequence ticker writes the display target); no second subscription exists
  const { displayTime, prayerName, isReady } = useCountdown(type);

  const overlayIsOn = useAtomValue(overlayIsOnAtom);
  const countdownBarShown = useAtomValue(countdownBarShownAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlayIsOn ? 1.5 : 1) }, { translateY: withTiming(overlayIsOn ? 5 : 0) }],
  }));

  // Show loading state if countdown not ready (sequence not initialized)
  if (!isReady && !overlayIsOn) {
    return null;
  }

  return (
    <Animated.View style={[styles.container]}>
      <View>
        <Text style={[styles.text]}>{prayerName}</Text>
        <Animated.Text style={[styles.countdown, animatedStyle]}>{displayTime}</Animated.Text>
        {countdownBarShown && <Bar type={type} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: STYLES.countdown.height,
    marginBottom: SPACING.section,
    marginTop: 6,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: SPACING.xxs + 1,
    color: COLORS.text.secondary,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  countdown: {
    color: COLORS.text.primary,
    fontSize: TEXT.sizeLarge,
    textAlign: 'center',
    fontFamily: TEXT.family.medium,
    marginBottom: SPACING.lg,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
});

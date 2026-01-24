import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import CountdownBar from '@/components/CountdownBar';
import { useCountdown } from '@/hooks/useCountdown';
import { COLORS, STYLES, TEXT } from '@/shared/constants';
import { formatTime } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayCountdownAtom } from '@/stores/countdown';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarShownAtom, showSecondsAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Countdown({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  // See: ai/adr/005-timing-system-overhaul.md
  const { timeLeft, prayerName, isReady } = useCountdown(type);

  const overlay = useAtomValue(overlayAtom);
  const showSeconds = useAtomValue(showSecondsAtom);
  const countdownBarShown = useAtomValue(countdownBarShownAtom);

  // Overlay mode uses dedicated overlay countdown atom (selected prayer countdown)
  const overlayCountdown = useAtomValue(overlayCountdownAtom);

  // Use countdown when overlay is on, otherwise use sequence-based countdown
  const displayName = overlay.isOn ? overlayCountdown.name : prayerName;
  const displayTime = overlay.isOn ? overlayCountdown.timeLeft : timeLeft;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  // Show loading state if countdown not ready (sequence not initialized)
  if (!isReady && !overlay.isOn) {
    return null;
  }

  return (
    <Animated.View style={[styles.container]}>
      <View>
        <Text style={[styles.text]}>{displayName}</Text>
        <Animated.Text style={[styles.countdown, animatedStyle]}>{formatTime(displayTime, !showSeconds)}</Animated.Text>
        {countdownBarShown && <CountdownBar type={type} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: STYLES.countdown.height,
    marginBottom: 50,
    marginTop: 10,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 8,
    color: COLORS.text.secondary,
  },
  countdown: {
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    fontFamily: TEXT.family.medium,
    marginBottom: 16,
  },
});

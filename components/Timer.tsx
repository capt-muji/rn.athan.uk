import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import ProgressBar from './ProgressBar';

import { useCountdown } from '@/hooks/useCountdown';
import { COLORS, STYLES, TEXT } from '@/shared/constants';
import { formatTime } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { overlayTimerAtom } from '@/stores/timer';
import { hideSecondsAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Timer({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  // See: ai/adr/005-timing-system-overhaul.md
  const { timeLeft, prayerName, isReady } = useCountdown(type);

  const overlay = useAtomValue(overlayAtom);
  const hideSeconds = useAtomValue(hideSecondsAtom);

  // Overlay mode uses dedicated overlay timer atom (selected prayer countdown)
  const overlayTimer = useAtomValue(overlayTimerAtom);

  // Use overlay timer when overlay is on, otherwise use sequence-based countdown
  const displayName = overlay.isOn ? overlayTimer.name : prayerName;
  const displayTime = overlay.isOn ? overlayTimer.timeLeft : timeLeft;

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
        <Animated.Text style={[styles.timer, animatedStyle]}>{formatTime(displayTime, hideSeconds)}</Animated.Text>
        <ProgressBar type={type} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: STYLES.timer.height,
    marginBottom: 40,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 8,
    color: COLORS.textSecondary,
  },
  timer: {
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    fontFamily: TEXT.family.medium,
    marginBottom: 16,
  },
});

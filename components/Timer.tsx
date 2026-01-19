import * as Haptics from 'expo-haptics';
import { useAtomValue, useSetAtom } from 'jotai';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import ProgressBar from './ProgressBar';

import { useCountdown } from '@/hooks/useCountdown';
import { COLORS, STYLES, TEXT } from '@/shared/constants';
import { formatTime } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { overlayTimerAtom } from '@/stores/timer';
import { progressBarVisibleAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Timer({ type }: Props) {
  // NEW: Use sequence-based countdown hook
  // See: ai/adr/005-timing-system-overhaul.md
  const { timeLeft, prayerName, isReady } = useCountdown(type);

  const overlay = useAtomValue(overlayAtom);
  const setProgressBarVisible = useSetAtom(progressBarVisibleAtom);

  // Overlay mode uses dedicated overlay timer atom (selected prayer countdown)
  const overlayTimer = useAtomValue(overlayTimerAtom);

  // Use overlay timer when overlay is on, otherwise use sequence-based countdown
  const displayName = overlay.isOn ? overlayTimer.name : prayerName;
  const displayTime = overlay.isOn ? overlayTimer.timeLeft : timeLeft;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  const handlePress = () => {
    setProgressBarVisible((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Show loading state if countdown not ready (sequence not initialized)
  if (!isReady && !overlay.isOn) {
    return null;
  }

  return (
    <Animated.View style={[styles.container]}>
      <Pressable onPress={handlePress} disabled={overlay.isOn}>
        <Text style={[styles.text]}>{displayName} in</Text>
        <Animated.Text style={[styles.timer, animatedStyle]}>{formatTime(displayTime)}</Animated.Text>

        <ProgressBar type={type} />
      </Pressable>
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
    marginBottom: 3,
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

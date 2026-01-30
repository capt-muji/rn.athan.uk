import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { TEXT, COLORS, SPACING, RADIUS, ANIMATION } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';

interface Props {
  type: ScheduleType;
}

/**
 * Displays time elapsed since the previous prayer
 *
 * Shows "now" for the first 60 seconds, then "Xm" or "Xh Ym" format.
 * Animates between normal and "recent" color states (≤5 mins).
 * Fades out when the overlay is open.
 *
 * @param type - Schedule type (Standard or Extra)
 */
export default function PrayerAgo({ type }: Props) {
  const { prayerAgo, minutesElapsed, isReady: prayerAgoReady } = usePrayerAgo(type);
  const overlay = useAtomValue(overlayAtom);
  const hasInitialized = useRef(false);

  // Color state: 0=normal, 1=recent (≤5 mins)
  // Initialize to correct state immediately (no flash) - minutesElapsed has correct value from lazy initializer
  const isRecentValue = useSharedValue(minutesElapsed <= 5 ? 1 : 0);

  // Sync color state: skip first render (already correct), animate subsequent changes
  useEffect(() => {
    if (!prayerAgoReady) return;

    const targetValue = minutesElapsed <= 5 ? 1 : 0;

    if (!hasInitialized.current) {
      // First valid data: set value immediately (no animation)
      // Handles case where store wasn't hydrated during initial useSharedValue
      isRecentValue.value = targetValue;
      hasInitialized.current = true;
    } else {
      // Subsequent changes: animate
      isRecentValue.value = withTiming(targetValue, {
        duration: ANIMATION.durationMedium,
        easing: Easing.linear,
      });
    }
  }, [minutesElapsed, prayerAgoReady]);

  // Fade out when overlay opens
  const prayerAgoOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(overlay.isOn ? 0 : 1, { duration: ANIMATION.durationFade }),
  }));

  // Smooth color transition
  const prayerAgoStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isRecentValue.value, [0, 1], [COLORS.prayerAgo.text, COLORS.feedback.success]),
    backgroundColor: interpolateColor(
      isRecentValue.value,
      [0, 1],
      [COLORS.prayerAgo.gradient.start, COLORS.prayerAgo.gradient.end]
    ),
  }));

  if (!prayerAgoReady) return null;

  return <Animated.Text style={[styles.prayerAgo, prayerAgoOpacity, prayerAgoStyle]}>{prayerAgo}</Animated.Text>;
}

const styles = StyleSheet.create({
  prayerAgo: {
    textAlign: 'center',
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.py,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    alignSelf: 'center',
  },
});

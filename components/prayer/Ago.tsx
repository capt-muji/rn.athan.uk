import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

import { useDerivedBackgroundColor, useDerivedColor, useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { ANIMATION, COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import type { ScheduleType } from '@/shared/types';
import { overlayIsOnAtom } from '@/stores/atoms/overlay';

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
  const overlayIsOn = useAtomValue(overlayIsOnAtom);

  // Derived from state, not an effect: first evaluation and resume snap, so a
  // suspend-dropped write cannot strand (see ai/features/overlay/spec.md)
  const isRecent = minutesElapsed <= 5 ? 1 : 0;
  const recentColorOptions = { duration: ANIMATION.durationMedium, easing: Easing.linear };
  const prayerAgoColorStyle = useDerivedColor(isRecent, {
    fromColor: COLORS.prayerAgo.text,
    toColor: COLORS.feedback.success,
    ...recentColorOptions,
  });
  const prayerAgoBackgroundStyle = useDerivedBackgroundColor(isRecent, {
    fromColor: COLORS.prayerAgo.gradient.start,
    toColor: COLORS.prayerAgo.gradient.end,
    ...recentColorOptions,
  });

  // Fade out when overlay opens (derived, so it cannot strand on resume)
  const prayerAgoOpacityStyle = useDerivedOpacity(overlayIsOn ? 0 : 1, { duration: ANIMATION.durationFade });

  if (!prayerAgoReady) return null;

  return (
    <Animated.Text style={[styles.prayerAgo, prayerAgoOpacityStyle, prayerAgoColorStyle, prayerAgoBackgroundStyle]}>
      {prayerAgo}
    </Animated.Text>
  );
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

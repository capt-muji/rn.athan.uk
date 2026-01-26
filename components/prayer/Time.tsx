import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, TEXT, SPACING, ANIMATION } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { refreshUIAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
  index: number;
  isOverlay?: boolean;
}

/**
 * Prayer time display component
 *
 * Displays the prayer time with color animation based on prayer state.
 * Supports cascade animations when date changes and highlights when
 * the prayer is selected in the overlay.
 *
 * @param type - Schedule type (Standard or Extra)
 * @param index - Prayer index within the schedule
 * @param isOverlay - Whether this is rendered in the overlay (default: false)
 */
export default function PrayerTime({ type, index, isOverlay = false }: Props) {
  const refreshUI = useAtomValue(refreshUIAtom);

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const overlay = useAtomValue(overlayAtom);

  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
  });

  // Detect if this prayer is currently selected in the overlay.
  // Note: Alert.tsx uses Prayer.isOverlay prop because Alert components render separately
  // inside the overlay. For Prayer.tsx and PrayerTime.tsx in the main schedule, we detect
  // overlay selection via overlayAtom to animate when tapped (before overlay renders).
  const isSelectedForOverlay = useMemo(
    () => overlay.isOn && overlay.selectedPrayerIndex === index && overlay.scheduleType === type,
    [overlay.isOn, overlay.selectedPrayerIndex, overlay.scheduleType, index, type]
  );

  // Force animation to respect new state immediately when refreshing
  useEffect(() => {
    AnimColor.animate(Prayer.ui.initialColorPos);
  }, [refreshUI]);

  // Animate when next prayer changes
  useEffect(() => {
    if (Prayer.isNext) AnimColor.animate(1);
  }, [Prayer.isNext]);

  // Cascade animation when date changes and we're at first prayer
  useEffect(() => {
    if (!isSelectedForOverlay && !Schedule.isLastPrayerPassed && Schedule.nextPrayerIndex === 0 && index !== 0) {
      const delay = getCascadeDelay(index, type);
      AnimColor.animate(0, { delay });
    }
  }, [Schedule.displayDate, isSelectedForOverlay]);

  // Overlay-aware animation: bright when selected, return to natural state when closed
  useEffect(() => {
    const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
    AnimColor.animate(colorPos, { duration: ANIMATION.durationVeryFast });
  }, [isSelectedForOverlay]);

  return (
    <View style={[styles.container]}>
      <Animated.Text style={[styles.text, AnimColor.style]}>{Prayer.time}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    marginLeft: SPACING.lg - 1,
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
});

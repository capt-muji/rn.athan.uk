import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationColor, useAnimationOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, RADIUS, SHADOW_ANDROID, STYLES, TEXT } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import type { ScheduleType } from '@/shared/types';
import { getOverlayHiddenAtom, getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { setSelectedPrayerIndex, toggleOverlay } from '@/stores/overlay';
import { refreshUIAtom, showArabicNamesAtom } from '@/stores/ui';

import Alert from './Alert';
import Time from './Time';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  type: ScheduleType;
  index: number;
}

/**
 * Prayer row component displaying prayer name, time, and notification controls
 *
 * Renders a pressable row with English name, optional Arabic name, time display,
 * and alert icon. Supports cascade animations when the date changes and
 * highlights when selected in the overlay.
 *
 * @param type - Schedule type (Standard or Extra)
 * @param index - Prayer index within the schedule
 */
export default function Prayer({ type, index }: Props) {
  const refreshUI = useAtomValue(refreshUIAtom);
  const showArabicNames = useAtomValue(showArabicNamesAtom);

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index);
  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));
  const isHiddenByOverlay = useAtomValue(useMemo(() => getOverlayHiddenAtom(type, index), [type, index]));

  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
  });

  const AnimOpacity = useAnimationOpacity(1);

  const computedStyleEnglish = {
    width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left,
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Name-based check: the row's sequence index shifts with display order, so an
    // index comparison cannot identify Istijaba (the old ISTIJABA_INDEX check was
    // dead since the list became chronological)
    if (!Schedule.isStandard && Prayer.english === 'Istijaba' && Prayer.isPassed) return;

    setSelectedPrayerIndex(type, index);
    toggleOverlay();
  };

  // Force animation to respect new state immediately when refreshing
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshUI is a deliberate re-fire signal; initialColorPos is read from the fresh render closure at signal time
  useEffect(() => {
    AnimColor.animate(Prayer.ui.initialColorPos);
  }, [refreshUI]);

  // Animate when next prayer changes
  useEffect(() => {
    if (Prayer.isNext) AnimColor.animate(1);
  }, [Prayer.isNext, AnimColor.animate]);

  // Cascade animation when date changes and we're at first prayer
  // biome-ignore lint/correctness/useExhaustiveDependencies: displayDate is the deliberate cascade trigger; the remaining values are read once per date change by design
  useEffect(() => {
    if (!isSelectedForOverlay && !Schedule.isLastPrayerPassed && Schedule.nextPrayerIndex === 0 && index !== 0) {
      const delay = getCascadeDelay(index, type);
      AnimColor.animate(0, { delay });
    }
  }, [Schedule.displayDate, isSelectedForOverlay]);

  // Overlay-aware animation: bright when selected, return to natural state when closed.
  // 150ms ≈ the original overlay's perceived row-rise pace (x19: 87→254 over ~150ms)
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on selection only; initialColorPos changes are handled by the refresh/next/cascade effects
  useEffect(() => {
    const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
    AnimColor.animate(colorPos, { duration: ANIMATION.durationFade });
  }, [isSelectedForOverlay]);

  // Per-element veil (ADR-014): non-selected rows fade out with the overlay's
  // 200ms fade — the old overlay hid them under the opaque gradient
  useEffect(() => {
    AnimOpacity.animate(isHiddenByOverlay ? 0 : 1, { duration: ANIMATION.duration });
  }, [isHiddenByOverlay, AnimOpacity.animate]);

  // Android depth shadow for the active row: lives on the row (the
  // pill's slide transform clips Android's boxShadow drawable on old Android)
  // and borderRadius mirrors the pill's corners so the shadow is rounded.
  // API >= 29 only — borderRadius + boxShadow together are dropped outright on
  // API 28 (verified: no shadow, hard edges; renders correctly from 29 up)
  const activeShadowStyle: ViewStyle | null =
    Platform.OS === 'android' && Platform.Version >= 29 && Prayer.isNext
      ? {
          borderRadius: RADIUS.md,
          boxShadow: Schedule.isStandard ? SHADOW_ANDROID.prayer : SHADOW_ANDROID.prayerExtras,
        }
      : null;

  return (
    <AnimatedPressable style={[styles.container, AnimOpacity.style, activeShadowStyle]} onPress={handlePress}>
      <Animated.Text style={[styles.text, styles.english, computedStyleEnglish, AnimColor.style]}>
        {Prayer.english}
      </Animated.Text>
      {showArabicNames && (
        <Animated.Text style={[styles.text, styles.arabic, AnimColor.style]}>{Prayer.arabic}</Animated.Text>
      )}
      <Time index={index} type={type} />
      <Alert index={index} type={type} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STYLES.prayer.height,
  },
  text: {
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
  },
  english: {
    paddingLeft: STYLES.prayer.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
});

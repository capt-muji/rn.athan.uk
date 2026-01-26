import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import Alert from './Alert';
import Time from './Time';

import { useAnimationColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { TEXT, COLORS, STYLES, ISTIJABA_INDEX, ANIMATION } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { overlayAtom, setSelectedPrayerIndex, toggleOverlay } from '@/stores/overlay';
import { refreshUIAtom, showArabicNamesAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
  index: number;
  isOverlay?: boolean;
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
 * @param isOverlay - Whether this is rendered in the overlay (default: false)
 */
export default function Prayer({ type, index, isOverlay = false }: Props) {
  const refreshUI = useAtomValue(refreshUIAtom);
  const showArabicNames = useAtomValue(showArabicNamesAtom);

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index);
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

  const computedStyleEnglish = {
    width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left,
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!Schedule.isStandard && index === ISTIJABA_INDEX && Prayer.isPassed) return;

    setSelectedPrayerIndex(type, index);
    toggleOverlay();
  };

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
    <Pressable style={styles.container} onPress={handlePress}>
      <Animated.Text style={[styles.text, styles.english, computedStyleEnglish, AnimColor.style]}>
        {Prayer.english}
      </Animated.Text>
      {showArabicNames && (
        <Animated.Text style={[styles.text, styles.arabic, AnimColor.style]}>{Prayer.arabic}</Animated.Text>
      )}
      <Time index={index} type={type} isOverlay={isOverlay} />
      <Alert index={index} type={type} isOverlay={isOverlay} />
    </Pressable>
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
    // Text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  english: {
    paddingLeft: STYLES.prayer.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
});

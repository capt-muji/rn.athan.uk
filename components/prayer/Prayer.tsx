import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDerivedColor, useDerivedOpacity } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, STYLES, TEXT } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import type { ScheduleType } from '@/shared/types';
import { getOverlayHiddenAtom, getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { closeOverlay, openOverlay } from '@/stores/overlay';
import { showArabicNamesAtom } from '@/stores/ui';

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
 * @param type - Schedule type (Standard or Extra)
 * @param index - Prayer index within the schedule
 */
export default function Prayer({ type, index }: Props) {
  const showArabicNames = useAtomValue(showArabicNamesAtom);

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index);
  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));
  const isHiddenByOverlay = useAtomValue(useMemo(() => getOverlayHiddenAtom(type, index), [type, index]));

  // One-shot date-roll stagger: the colour target flips (bright to dim) when
  // the display date rolls to the next day
  const previousDisplayDate = usePrevious(Schedule.displayDate);
  const isCascadeRoll =
    previousDisplayDate !== Schedule.displayDate &&
    !isSelectedForOverlay &&
    !Schedule.isLastPrayerPassed &&
    Schedule.nextPrayerIndex === 0 &&
    index !== 0;
  const previousIsSelected = usePrevious(isSelectedForOverlay);
  const isSelectionChange = previousIsSelected !== undefined && previousIsSelected !== isSelectedForOverlay;

  // Selected is always fully bright; otherwise the natural passed/next/upcoming position.
  // Pre-ADR-015 timings: overlay selection 150ms; next-prayer advance and date-roll cascade 1000ms
  const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
  const colorStyle = useDerivedColor(colorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });
  const veilStyle = useDerivedOpacity(isHiddenByOverlay ? 0 : 1, { duration: ANIMATION.duration });

  const computedStyleEnglish = {
    width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left,
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Name-based check: the row's sequence index shifts with display order, so an
    // index comparison cannot identify Istijaba (the old ISTIJABA_INDEX check was
    // dead since the list became chronological)
    if (!Schedule.isStandard && Prayer.english === 'Istijaba' && Prayer.isPassed) return;

    if (isSelectedForOverlay) closeOverlay();
    else openOverlay(type, index);
  };

  return (
    <AnimatedPressable
      style={[styles.container, veilStyle]}
      onPress={handlePress}
      accessibilityElementsHidden={isHiddenByOverlay}
      importantForAccessibility={isHiddenByOverlay ? 'no-hide-descendants' : 'auto'}>
      <Animated.Text style={[styles.text, styles.english, computedStyleEnglish, colorStyle]}>
        {Prayer.english}
      </Animated.Text>
      {showArabicNames && (
        <Animated.Text style={[styles.text, styles.arabic, colorStyle]}>{Prayer.arabic}</Animated.Text>
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

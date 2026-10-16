import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDerivedColor } from '@/hooks/useAnimation';
import { getShownTime, usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { isCascadeRow, useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, SPACING, TEXT, UNAVAILABLE_TIME } from '@/shared/constants';
import { currentLocaleId } from '@/shared/i18n/locale';
import { getCascadeDelay } from '@/shared/prayer';
import { splitSingleColon } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getOverlaySelectedAtom } from '@/stores/atoms/overlay';

import { colonInkPair } from './colonInk';

interface Props {
  type: ScheduleType;
  index: number;
}

/**
 * Prayer time display component
 *
 * Overlay-aware (ADR-014): when this row is overlay-selected AND passed, the
 * time shows the next occurrence (what the old duplicated row displayed).
 *
 * @param type - Schedule type (Standard or Extra)
 * @param index - Prayer index within the schedule
 */
export default function PrayerTime({ type, index }: Props) {
  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index);
  const NextOccurrencePrayer = usePrayer(type, index, true);
  const isSelectedForOverlay = useAtomValue(useMemo(() => getOverlaySelectedAtom(type, index), [type, index]));

  const displayTime = getShownTime(isSelectedForOverlay, Prayer, NextOccurrencePrayer) ?? UNAVAILABLE_TIME;

  const previousDisplayDate = usePrevious(Schedule.displayDate);
  const isCascadeRoll =
    previousDisplayDate !== Schedule.displayDate &&
    !isSelectedForOverlay &&
    !Schedule.isLastPrayerPassed &&
    isCascadeRow(Schedule, index);
  const previousIsSelected = usePrevious(isSelectedForOverlay);
  const isSelectionChange = previousIsSelected !== undefined && previousIsSelected !== isSelectedForOverlay;

  // Timings mirror Prayer.tsx: selection 150ms, next-prayer advance and cascade 1000ms
  const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
  const colorStyle = useDerivedColor(colorPos, {
    fromColor: COLORS.text.rowTime,
    toColor: COLORS.text.primary,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  const parts = displayTime === UNAVAILABLE_TIME ? null : splitSingleColon(displayTime);

  const isStandard = type === ScheduleType.Standard;
  // The animated style owns the colon in every state, its endpoint pair keyed to the row:
  // a static ink swapped in after an animated one leaves the array never lands on Fabric,
  // which keeps the dim colour the UI thread last applied (owner report, 2026-10-16)
  const colonPair = colonInkPair({
    isNext: Prayer.isNext,
    isPassed: Prayer.isPassed,
    isSelected: isSelectedForOverlay,
    isStandard,
  });
  const colonColorStyle = useDerivedColor(colorPos, {
    fromColor: colonPair.from,
    toColor: colonPair.to,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  return (
    <View style={[styles.container]}>
      {parts === null ? (
        <Animated.Text style={[styles.text, colorStyle]}>{displayTime}</Animated.Text>
      ) : (
        <View style={styles.timeRow} accessible accessibilityLabel={displayTime}>
          <Animated.Text style={[styles.textPart, colorStyle]}>{parts[0]}</Animated.Text>
          <Animated.Text style={[styles.textPart, styles.colon, colonColorStyle]}>{':'}</Animated.Text>
          <Animated.Text style={[styles.textPart, colorStyle]}>{parts[1]}</Animated.Text>
        </View>
      )}
    </View>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: ty.familyRowTime,
    fontSize: ty.size(TEXT.size),
    textAlign: 'center',
    marginStart: SPACING.lg - 1,
  },
  textPart: {
    fontFamily: ty.familyRowTime,
    fontSize: ty.size(TEXT.size),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: SPACING.lg - 1,
    direction: 'ltr',
  },
  colon: {
    color: COLORS.countdown.timeColon,
    marginHorizontal: 3,
    transform: [{ translateY: -1.5 }],
  },
});

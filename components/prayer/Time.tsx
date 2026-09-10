import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDerivedColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, SPACING, TEXT } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import type { ScheduleType } from '@/shared/types';
import { getOverlaySelectedAtom } from '@/stores/atoms/overlay';

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

  const displayTime = isSelectedForOverlay && Prayer.isPassed ? NextOccurrencePrayer.time : Prayer.time;

  const previousDisplayDate = usePrevious(Schedule.displayDate);
  const isCascadeRoll =
    previousDisplayDate !== Schedule.displayDate &&
    !isSelectedForOverlay &&
    !Schedule.isLastPrayerPassed &&
    Schedule.nextPrayerIndex === 0 &&
    index !== 0;

  // The cascade roll gets the old duration back (durationSlow, 1000ms) — see
  // components/prayer/Prayer.tsx for why; ordinary selection changes keep 150ms.
  const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
  const colorStyle = useDerivedColor(colorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    duration: isCascadeRoll ? ANIMATION.durationSlow : ANIMATION.durationFade,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  return (
    <View style={[styles.container]}>
      <Animated.Text style={[styles.text, colorStyle]}>{displayTime}</Animated.Text>
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
  },
});

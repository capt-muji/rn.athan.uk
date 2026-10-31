import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { getRowPressAction } from '@/components/prayer/rowPress';
import { useDerivedProgress, useDerivedVeiledColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { isCascadeRow, useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, STYLES, TEXT } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { getCascadeDelay } from '@/shared/prayer';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getOverlayHiddenAtom, getOverlaySelectedAtom } from '@/stores/atoms/overlay';
import { closeOverlay, openOverlay } from '@/stores/overlay';

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
    isCascadeRow(Schedule, index);
  const previousIsSelected = usePrevious(isSelectedForOverlay);
  const isSelectionChange = previousIsSelected !== undefined && previousIsSelected !== isSelectedForOverlay;

  // Selected is always fully bright; otherwise the natural passed/next/upcoming position.
  // Pre-ADR-015 timings: overlay selection 150ms; next-prayer advance and date-roll cascade 1000ms.
  // The overlay's veil wraps this tween: a hidden row's ink sinks toward the veil solid, so the
  // row fades without any of its text ever rendering through an opacity
  const colorPos = isSelectedForOverlay ? 1 : Prayer.ui.initialColorPos;
  const veilTarget = isHiddenByOverlay ? 1 : 0;
  const colorStyle = useDerivedVeiledColor(veilTarget, colorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.duration,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  // The row's own cut, the badge's pattern (T-490): display drops to none in the worklet
  // evaluation that carries the veil progress to 1 - the frame the row's ink finished
  // sinking into the veil - and flips flex the moment the veil lifts on close. The row
  // reads no settle flag: the fade's completion used to re-render all six rows to drop
  // five of them, a JS commit plus a deletion-heavy diff inside the entrance window
  // (digest 5111's wave 4, step 25's subject), and the worklet lands the same cut on
  // content already invisible with no commit at all
  const veilProgress = useDerivedProgress(veilTarget, { duration: ANIMATION.duration });
  const contentCutStyle = useAnimatedStyle(() => ({ display: veilProgress.value >= 1 ? 'none' : 'flex' }));

  // A row whose occurrence left the sequence (refresh mid-selection) reports the
  // loading frame: empty time, the sentinel id. It draws no name, exactly as the
  // empty pre-union name did, so no frame ever borrows another prayer's label
  const shownName = Prayer.time === '' ? '' : prayerLabel(Prayer.id);

  const computedNameStyle = {
    width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.start,
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const action = getRowPressAction({
      isStandard: Schedule.isStandard,
      id: Prayer.id,
      isPassed: Prayer.isPassed,
      isSelectedForOverlay,
    });
    if (action === 'close') closeOverlay();
    if (action === 'open') openOverlay(type, index);
  };

  return (
    <AnimatedPressable
      style={styles.container}
      onPress={handlePress}
      accessibilityElementsHidden={isHiddenByOverlay}
      importantForAccessibility={isHiddenByOverlay ? 'no-hide-descendants' : 'auto'}>
      <Animated.View style={[styles.content, contentCutStyle]}>
        <Animated.Text style={[styles.text, styles.name, computedNameStyle, colorStyle]}>{shownName}</Animated.Text>
        <Time index={index} type={type} />
        <Alert index={index} type={type} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const ty = typographyFor(currentLocaleId());

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STYLES.prayer.height,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  text: {
    fontFamily: ty.familyRegular,
    fontSize: ty.size(TEXT.size),
  },
  name: {
    paddingStart: STYLES.prayer.padding.start,
  },
});

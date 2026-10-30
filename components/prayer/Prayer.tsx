import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { getRowPressAction } from '@/components/prayer/rowPress';
import { useDerivedVeiledColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { usePrevious } from '@/hooks/usePrevious';
import { isCascadeRow, useSchedule } from '@/hooks/useSchedule';
import { ANIMATION, COLORS, STYLES, TEXT } from '@/shared/constants';
import { prayerLabel } from '@/shared/i18n';
import { currentLocaleId } from '@/shared/i18n/locale';
import { getCascadeDelay } from '@/shared/prayer';
import type { ScheduleType } from '@/shared/types';
import { typographyFor } from '@/shared/typography';
import { getOverlayHiddenAtom, getOverlaySelectedAtom, overlayFadeSettledAtom } from '@/stores/atoms/overlay';
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
  const fadeSettled = useAtomValue(overlayFadeSettledAtom);

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
  const colorStyle = useDerivedVeiledColor(isHiddenByOverlay ? 1 : 0, colorPos, {
    fromColor: COLORS.text.muted,
    toColor: COLORS.text.primary,
    veilColor: COLORS.gradient.overlay.veil,
    veilDuration: ANIMATION.duration,
    duration: isSelectionChange ? ANIMATION.durationFade : ANIMATION.durationSlow,
    delay: isCascadeRoll ? getCascadeDelay(index, type) : 0,
  });

  // Held drawn through the fade by the shared fade-settled flag, then dropped:
  // the resting frame under an open overlay shows the backdrop exactly, while
  // the close's own flag write returns the row in the same commit — no second
  // per-row commit wave inside the fade
  const hiddenSettled = isHiddenByOverlay && fadeSettled;

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
      <View style={[styles.content, { display: hiddenSettled ? 'none' : 'flex' }]}>
        <Animated.Text style={[styles.text, styles.name, computedNameStyle, colorStyle]}>{shownName}</Animated.Text>
        <Time index={index} type={type} />
        <Alert index={index} type={type} />
      </View>
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

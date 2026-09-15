import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

import { getActivePillOpacity, getActivePillRow } from '@/components/prayer/activePill';
import { useDerivedOpacity, useDerivedTranslateY } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ANIMATION, COLORS, RADIUS, SHADOW, SHADOW_ANDROID, STYLES } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

// Frozen at module scope: a fresh easing function each render would restart
// the derived mapper on every render
const PILL_SLIDE_EASING = Easing.elastic(0.5);

export default function ActiveBackground({ type }: Props) {
  const { prayers, displayDate } = usePrayerSequence(type);

  // Read in render and written after commit, so a list with no row next leaves the pill where it faded
  const heldPillRow = useRef(0);
  const pillRow = getActivePillRow(prayers, displayDate, type, heldPillRow.current);
  useEffect(() => {
    heldPillRow.current = pillRow;
  }, [pillRow]);

  const yPosition = pillRow * STYLES.prayer.height;

  const translateStyle = useDerivedTranslateY(yPosition, {
    duration: ANIMATION.durationSlow,
    easing: PILL_SLIDE_EASING,
  });

  const activeColor =
    type === ScheduleType.Standard ? COLORS.prayer.activeBackground : COLORS.prayer.activeBackgroundExtras;

  const overlay = useAtomValue(overlayAtom);
  const pillOpacity = getActivePillOpacity(prayers, displayDate, type, overlay);

  const veilStyle = useDerivedOpacity(pillOpacity, {
    duration: ANIMATION.duration,
  });

  const isStandard = type === ScheduleType.Standard;
  const shadowStyle = isStandard ? SHADOW.prayer : SHADOW.prayerExtras;
  const shadowColor = isStandard ? COLORS.shadow.prayer : COLORS.shadow.prayerExtras;
  // Android depth shadow rides the pill itself so it travels with the slide —
  // a row-anchored shadow keyed to isNext lands on the new row a full second
  // before the pill arrives. API >= 29 only: borderRadius + boxShadow together
  // are dropped outright on API 28
  const androidBoxShadow =
    Platform.OS === 'android' && Platform.Version >= 29
      ? isStandard
        ? SHADOW_ANDROID.prayer
        : SHADOW_ANDROID.prayerExtras
      : undefined;

  const computedStyles: ViewStyle = {
    ...shadowStyle,
    shadowColor,
    elevation: 0, // Must be 0 to stay below Prayer components on Android
    zIndex: -1, // Ensure it's behind prayer text
    ...(androidBoxShadow !== undefined ? { boxShadow: androidBoxShadow } : {}),
  };

  return (
    <Animated.View
      style={[styles.background, computedStyles, { backgroundColor: activeColor }, translateStyle, veilStyle]}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: STYLES.prayer.height,
    borderRadius: RADIUS.md,
  },
});

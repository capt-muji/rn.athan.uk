import { useAtomValue } from 'jotai';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';

import { useDerivedOpacity, useDerivedTranslateY } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ANIMATION, COLORS, EXTRAS_ENGLISH, RADIUS, SHADOW, SHADOW_ANDROID, STYLES } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';

interface Props {
  type: ScheduleType;
}

// Frozen at module scope: a fresh easing function each render would restart
// the derived mapper on every render
const PILL_SLIDE_EASING = Easing.elastic(0.5);

export default function ActiveBackground({ type }: Props) {
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

  // Filter prayers to today's prayers and find the next prayer index within that list
  // This gives us 0-5 for standard, 0-6 for extras (same as old schedule.nextIndex)
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);

  // nextPrayerIndex is the next prayer's position in the chronological
  // sequence, not its on-screen row: Extras rows display in canonical rank
  // order (see canonicalDisplayOrder), which the chronological index does not
  // generally match. Resolve the pill's actual visual row from the next
  // prayer's name (Standard has no such reordering, so its index is already
  // the visual row).
  const isExtra = type === ScheduleType.Extra;
  const nextPrayerVisualRow =
    isExtra && nextPrayerIndex >= 0 ? EXTRAS_ENGLISH.indexOf(todayPrayers[nextPrayerIndex].english) : nextPrayerIndex;

  const yPosition = (isReady && nextPrayerVisualRow >= 0 ? nextPrayerVisualRow : 0) * STYLES.prayer.height;

  const translateStyle = useDerivedTranslateY(yPosition, {
    duration: ANIMATION.durationSlow,
    easing: PILL_SLIDE_EASING,
  });

  const activeColor =
    type === ScheduleType.Standard ? COLORS.prayer.activeBackground : COLORS.prayer.activeBackgroundExtras;

  // The pill fades out while the overlay is open unless its row IS the selected
  // one (the selected next prayer keeps it, as the old copied row did)
  const overlay = useAtomValue(overlayAtom);
  const isHiddenByOverlay =
    overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== nextPrayerIndex;

  const veilStyle = useDerivedOpacity(isHiddenByOverlay ? 0 : 1, { duration: ANIMATION.duration });

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

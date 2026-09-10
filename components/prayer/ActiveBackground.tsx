import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationBackgroundColor, useAnimationOpacity, useAnimationTranslateY } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { ANIMATION, COLORS, RADIUS, SHADOW, SHADOW_ANDROID, STYLES } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/atoms/overlay';
import { refreshUIAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function ActiveBackground({ type }: Props) {
  // NEW: Use sequence-based prayer data
  // See: ai/adr/005-timing-system-overhaul.md
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

  // Filter prayers to today's prayers and find the next prayer index within that list
  // This gives us 0-5 for standard, 0-6 for extras (same as old schedule.nextIndex)
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);

  // These derived values will recompute on every render when dependencies change
  // This is fine because they're just JavaScript calculations, not shared value modifications
  const yPosition = (isReady && nextPrayerIndex >= 0 ? nextPrayerIndex : 0) * STYLES.prayer.height;

  // Initialize animations with starting values
  // These shared values are created once and persist between renders
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const activeColor =
    type === ScheduleType.Standard ? COLORS.prayer.activeBackground : COLORS.prayer.activeBackgroundExtras;

  const AnimBackgroundColor = useAnimationBackgroundColor(1, {
    fromColor: 'transparent',
    toColor: activeColor,
  });

  // Per-element veil (ADR-014): the pill fades out while the overlay is open
  // unless its row IS the selected one (the selected next prayer keeps it —
  // exactly what the old overlay's copied row background showed)
  const overlay = useAtomValue(overlayAtom);
  const isHiddenByOverlay =
    overlay.isOn && overlay.scheduleType === type && overlay.selectedPrayerIndex !== nextPrayerIndex;
  const AnimOpacity = useAnimationOpacity(1);

  const refreshUI = useAtomValue(refreshUIAtom);

  useEffect(() => {
    AnimOpacity.animate(isHiddenByOverlay ? 0 : 1, { duration: ANIMATION.duration });
  }, [isHiddenByOverlay, AnimOpacity.animate]);

  // This effect runs after render and handles all animation logic
  // Benefits:
  // 1. Follows Reanimated v4's worklet rules (no shared value modifications during render)
  // 2. Still reacts to all Jotai state changes via dependencies
  // 3. Maintains animation sequence integrity
  // 4. Prevents animation flicker by running after render is complete
  useEffect(() => {
    AnimBackgroundColor.animate(1);
    AnimTranslateY.animate(yPosition);
  }, [yPosition, AnimBackgroundColor.animate, AnimTranslateY.animate]); // Dependencies ensure animations update when values change

  // A boundary crossed while the host was suspended can strand the slide, and
  // yPosition never changes again afterwards — the resume signal is the only
  // later trigger, so the pill slides from wherever it froze to the current row
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshUI is a deliberate re-fire signal; yPosition is read from the fresh render closure at signal time
  useEffect(() => {
    AnimTranslateY.animate(yPosition);
  }, [refreshUI]);

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
      style={[styles.background, computedStyles, AnimBackgroundColor.style, AnimTranslateY.style, AnimOpacity.style]}
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

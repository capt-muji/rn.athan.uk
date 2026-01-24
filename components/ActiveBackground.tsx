import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationBackgroundColor, useAnimationTranslateY } from '@/hooks/useAnimation';
import { usePrayerSequence } from '@/hooks/usePrayerSequence';
import { COLORS, STYLES } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

interface Props {
  type: ScheduleType;
}

export default function ActiveBackground({ type }: Props) {
  // NEW: Use sequence-based prayer data
  // See: ai/adr/005-timing-system-overhaul.md
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

  // Filter to today's prayers and find the next prayer index within that list
  // This gives us 0-5 for standard, 0-6 for extras (same as old schedule.nextIndex)
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
  const nextPrayerIndex = todayPrayers.findIndex((p) => p.isNext);

  // These derived values will recompute on every render when dependencies change
  // This is fine because they're just JavaScript calculations, not shared value modifications
  const yPosition = (isReady && nextPrayerIndex >= 0 ? nextPrayerIndex : 0) * STYLES.prayer.height;

  // Initialize animations with starting values
  // These shared values are created once and persist between renders
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const AnimBackgroundColor = useAnimationBackgroundColor(1, {
    fromColor: 'transparent',
    toColor: COLORS.prayer.activeBackground,
  });

  // This effect runs after render and handles all animation logic
  // Benefits:
  // 1. Follows Reanimated v4's worklet rules (no shared value modifications during render)
  // 2. Still reacts to all Jotai state changes via dependencies
  // 3. Maintains animation sequence integrity
  // 4. Prevents animation flicker by running after render is complete
  useEffect(() => {
    AnimBackgroundColor.animate(1);
    AnimTranslateY.animate(yPosition);
  }, [yPosition]); // Dependencies ensure animations update when values change

  const computedStyles: ViewStyle = {
    shadowColor: COLORS.shadow.prayer,
    elevation: 0, // Must be 0 to stay below Prayer components on Android
    zIndex: -1, // Ensure it's behind prayer text
  };

  return <Animated.View style={[styles.background, computedStyles, AnimBackgroundColor.style, AnimTranslateY.style]} />;
}

const styles = StyleSheet.create({
  background: {
    ...STYLES.prayer.shadow,
    position: 'absolute',
    width: '100%',
    height: STYLES.prayer.height,
    borderRadius: 8,
  },
});

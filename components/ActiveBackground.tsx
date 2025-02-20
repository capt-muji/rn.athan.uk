import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationBackgroundColor, useAnimationTranslateY } from '@/hooks/useAnimation';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, STYLES } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/sync';

interface Props {
  type: ScheduleType;
}

export default function ActiveBackground({ type }: Props) {
  const { schedule, isStandard, isLastPrayerPassed } = useSchedule(type);

  // State
  const date = useAtomValue(dateAtom);

  // These derived values will recompute on every render when dependencies change
  // This is fine because they're just JavaScript calculations, not shared value modifications
  const today = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
  const yPosition = schedule.nextIndex * STYLES.prayer.height;
  const shouldHide = schedule.nextIndex === 0 && date === today && isLastPrayerPassed;

  // Initialize animations with starting values
  // These shared values are created once and persist between renders
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const AnimBackgroundColor = useAnimationBackgroundColor(shouldHide ? 0 : 1, {
    fromColor: 'transparent',
    toColor: COLORS.activeBackground,
  });

  // This effect runs after render and handles all animation logic
  // Benefits:
  // 1. Follows Reanimated v4's worklet rules (no shared value modifications during render)
  // 2. Still reacts to all Jotai state changes via dependencies
  // 3. Maintains animation sequence integrity
  // 4. Prevents animation flicker by running after render is complete
  useEffect(() => {
    if (shouldHide) {
      AnimBackgroundColor.animate(0, {
        onFinish: () => {
          AnimTranslateY.animate(0);
        },
      });
    } else {
      AnimBackgroundColor.animate(1);
      AnimTranslateY.animate(yPosition);
    }
  }, [shouldHide, yPosition]); // Dependencies ensure animations update when values change

  const computedStyles: ViewStyle = {
    shadowColor: isStandard ? COLORS.standardActiveBackgroundShadow : COLORS.extraActiveBackgroundShadow,
    elevation: shouldHide ? 0 : 15,
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

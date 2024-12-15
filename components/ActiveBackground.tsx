import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
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

  // Derived State
  const today = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
  const yPosition = schedule.nextIndex * STYLES.prayer.height;
  const shouldHide = schedule.nextIndex === 0 && date === today && isLastPrayerPassed;

  // Animations
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const AnimBackgroundColor = useAnimationBackgroundColor(shouldHide ? 0 : 1, {
    fromColor: 'transparent',
    toColor: COLORS.activeBackground,
  });

  if (shouldHide) AnimBackgroundColor.animate(0, { onFinish: () => (AnimTranslateY.value.value = 0) });
  else AnimTranslateY.animate(yPosition);

  const computedStyles = {
    shadowColor: isStandard ? COLORS.standardActiveBackgroundShadow : COLORS.extraActiveBackgroundShadow,
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

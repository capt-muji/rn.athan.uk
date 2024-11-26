import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';

import { COLORS, PRAYER } from '@/shared/constants';
import { dateAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import * as TimeUtils from '@/shared/time';
import { usePrayer } from '@/hooks/usePrayer';
import { useAnimationBackgroundColor, useAnimationTranslateY } from '@/hooks/useAnimations';

interface Props { type: ScheduleType };

export default function ActiveBackground({ type }: Props) {
  const Prayer = usePrayer(0, type);

  // State
  const date = useAtomValue(dateAtom);

  // Derived State
  const todayYYYMMDD = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
  const yPosition = Prayer.schedule.nextIndex * PRAYER.height;
  const shouldHide = Prayer.schedule.nextIndex === 0 && date.current === todayYYYMMDD && Prayer.isLastPrayerPassed;

  // Animations
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const AnimBackgroundColor = useAnimationBackgroundColor(
    shouldHide ? 0 : 1,
    { fromColor: 'transparent', toColor: COLORS.activeBackground }
  );

  if (shouldHide) {
    AnimBackgroundColor.animate(0, {
      onFinish: () => AnimTranslateY.value.value = 0
    });
  } else {
    AnimTranslateY.animate(yPosition);
  }

  return <Animated.View style={[styles.background, AnimBackgroundColor.style, AnimTranslateY.style]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: PRAYER.height,
    borderRadius: 8,
    shadowOffset: { width: 1, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowColor: COLORS.activeBackgroundShadow
  }
});

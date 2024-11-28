import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationBackgroundColor, useAnimationTranslateY } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { COLORS, STYLES } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/store';

interface Props {
  type: ScheduleType;
}

export default function ActiveBackground({ type }: Props) {
  const Prayer = usePrayer(0, type);

  // State
  const date = useAtomValue(dateAtom);

  // Derived State
  const todayYYYMMDD = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
  const yPosition = Prayer.schedule.nextIndex * STYLES.prayer.height;
  const shouldHide = Prayer.schedule.nextIndex === 0 && date.current === todayYYYMMDD && Prayer.isLastPrayerPassed;

  // Animations
  const AnimTranslateY = useAnimationTranslateY(yPosition);
  const AnimBackgroundColor = useAnimationBackgroundColor(shouldHide ? 0 : 1, {
    fromColor: 'transparent',
    toColor: COLORS.activeBackground,
  });

  if (shouldHide) {
    AnimBackgroundColor.animate(0, {
      onFinish: () => (AnimTranslateY.value.value = 0),
    });
  } else {
    AnimTranslateY.animate(yPosition);
  }

  const computedStyles = {
    shadowColor: Prayer.isStandard ? styles.standard.shadowColor : styles.extra.shadowColor,
  };

  return (
    <Animated.View
      style={[styles.background, styles.shadow, computedStyles, AnimBackgroundColor.style, AnimTranslateY.style]}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: STYLES.prayer.height,
    borderRadius: 8,
  },
  shadow: {
    ...STYLES.prayer.shadow,
  },
  standard: {
    shadowColor: COLORS.standardActiveBackgroundShadow,
  },
  extra: {
    shadowColor: COLORS.extraActiveBackgroundShadow,
  },
});

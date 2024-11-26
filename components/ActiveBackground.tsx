import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';
import { COLORS, PRAYER } from '@/shared/constants';
import { dateAtom, extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import * as timeUtils from '@/shared/time';
import * as prayerUtils from '@/shared/prayer';
import { useBackgroundColorAnimation, useTranslateYAnimation } from '@/hooks/animations';

interface Props { type: ScheduleType };

export default function ActiveBackground({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  // State
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  // Derived State
  const todayYYYMMDD = timeUtils.formatDateShort(timeUtils.createLondonDate());
  const isLastPrayerPassed = prayerUtils.isLastPrayerPassed(schedule);
  const shouldShowBackground = !isLastPrayerPassed;
  const yPosition = schedule.nextIndex * PRAYER.height;
  const shouldHide = schedule.nextIndex === 0 && date.current === todayYYYMMDD && isLastPrayerPassed;

  // Animations
  const { style: colorStyle, animate: animateColor } = useBackgroundColorAnimation(shouldShowBackground ? 1 : 0);
  const { style: translateStyle, animate: animateTranslate } = useTranslateYAnimation(yPosition);

  if (shouldHide) {
    animateColor(0, { 
      onFinish: () => animateTranslate(0)
    });
  } else {
    animateTranslate(yPosition);
  }

  return <Animated.View style={[styles.background, colorStyle, translateStyle]} />;
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

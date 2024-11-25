import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { ANIMATION, COLORS, PRAYER } from '@/shared/constants';
import { dateAtom, extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType, ScheduleStore, DateStore } from '@/shared/types';
import * as timeUtils from '@/shared/time';

const ANIMATION_CONFIG = {
  timing: {
    duration: ANIMATION.durationSlow,
    durationSlower: ANIMATION.durationSlower,
    easing: Easing.elastic(0.5)
  }
};

const createAnimations = (nextIndex: number, isLastPrayerPassed: boolean) => ({
  translateY: useSharedValue(nextIndex * PRAYER.height),
  colorPos: useSharedValue(isLastPrayerPassed ? 0 : 1)
});

const createAnimatedStyles = (
  animations: ReturnType<typeof createAnimations>,
  schedule: ScheduleStore,
  date: DateStore,
  todayYYYMMDD: string
) => ({
  background: useAnimatedStyle(() => {
    if (schedule.nextIndex === 0 && date.current === todayYYYMMDD) {
      animations.colorPos.value = withTiming(0, { duration: ANIMATION_CONFIG.timing.duration });
      animations.translateY.value = withSequence(
        withTiming(animations.translateY.value, { duration: ANIMATION_CONFIG.timing.duration }),
        withTiming(0, { duration: 0 })
      );
    } else {
      animations.translateY.value = schedule.nextIndex * PRAYER.height;
    }

    return {
      backgroundColor: interpolateColor(
        animations.colorPos.value,
        [0, 1],
        ['transparent', COLORS.activeBackground]
      ),
      transform: [{
        translateY: withTiming(animations.translateY.value, {
          duration: ANIMATION_CONFIG.timing.durationSlower,
          easing: ANIMATION_CONFIG.timing.easing
        })
      }]
    };
  })
});

interface Props { type: ScheduleType }

export default function ActiveBackground({ type }: Props) {
  // State
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);
  const todayYYYMMDD = timeUtils.formatDateShort(timeUtils.createLondonDate());

  // Derived State
  const lastPrayerIndex = Object.keys(schedule.today).length - 1;
  const isLastPrayerPassed = timeUtils.isTimePassed(schedule.today[lastPrayerIndex].time);

  // Animations
  const animations = createAnimations(schedule.nextIndex, isLastPrayerPassed);
  const animatedStyles = createAnimatedStyles(animations, schedule, date, todayYYYMMDD);

  if (!isLastPrayerPassed) {
    animations.colorPos.value = withTiming(1, { duration: ANIMATION_CONFIG.timing.duration });
  }

  return <Animated.View style={[styles.background, animatedStyles.background]} />;
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

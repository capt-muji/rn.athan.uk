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
import { ScheduleType } from '@/shared/types';
import * as timeUtils from '@/shared/time';

interface Props {
  type: ScheduleType
}

export default function ActiveBackground({ type }: Props) {
  // Get schedule data based on standard/extra prayer type
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const date = useAtomValue(dateAtom);

  // Determine if we've passed the last prayer of the day
  const lastPrayerIndex = Object.keys(schedule.today).length - 1;
  const lastPrayerTime = schedule.today[lastPrayerIndex].time;
  const isLastPrayerPassed = timeUtils.isTimePassed(lastPrayerTime);

  // Initialize animation values for position and opacity
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);
  const colorProgress = useSharedValue(isLastPrayerPassed ? 0 : 1);
  const today = timeUtils.formatDateShort(timeUtils.createLondonDate());

  const animatedStyles = useAnimatedStyle(() => {
    // Reset position and fade out when day is complete
    if (schedule.nextIndex === 0 && date.current === today) {
      colorProgress.value = withTiming(0, { duration: ANIMATION.durationSlow });
      translateY.value = withSequence(
        withTiming(translateY.value, { duration: ANIMATION.durationSlow }),
        withTiming(0, { duration: 0 })
      );
    } else {
      translateY.value = schedule.nextIndex * PRAYER.height;
    }

    // Fade in background when new day starts
    if (!isLastPrayerPassed) {
      colorProgress.value = withTiming(1, { duration: ANIMATION.durationSlow });
    }

    // Apply animated styles with interpolated background color and elastic movement
    return {
      backgroundColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        ['transparent', COLORS.activeBackground]
      ),
      transform: [{
        translateY: withTiming(translateY.value, {
          duration: ANIMATION.durationSlower,
          easing: Easing.elastic(0.5)
        })
      }]
    };
  });

  // Render animated background view with shadow
  return <Animated.View style={[styles.background, animatedStyles]} />;
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

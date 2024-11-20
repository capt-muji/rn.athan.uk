import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { COLORS, PRAYER } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';

interface Props { type: ScheduleType };

export default function ActiveBackground({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);
  const translateY = useSharedValue(schedule.nextIndex * PRAYER.height);

  useEffect(() => {
    translateY.value = schedule.nextIndex * PRAYER.height;
  }, [schedule.nextIndex]);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{
      translateY: withSpring(translateY.value, { damping: 12, stiffness: 90, mass: 0.8 })
    }],
  }));

  return <Animated.View style={[styles.background, animatedStyles]} />;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: PRAYER.height,
    borderRadius: 8,
    shadowOffset: { width: 1, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow
  }
});

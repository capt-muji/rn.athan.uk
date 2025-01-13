import { useAtomValue } from 'jotai';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, STYLES, TEXT } from '@/shared/constants';
import { formatTime } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { standardTimerAtom, extraTimerAtom, overlayTimerAtom } from '@/stores/timer';

interface Props {
  type: ScheduleType;
  isOverlay?: boolean;
}

export default function Timer({ type }: Props) {
  const { isStandard, isLastPrayerPassed } = useSchedule(type);

  const overlay = useAtomValue(overlayAtom);

  const timerAtom = overlay.isOn ? overlayTimerAtom : isStandard ? standardTimerAtom : extraTimerAtom;
  const timer = useAtomValue(timerAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  if (!overlay.isOn && isLastPrayerPassed) {
    return (
      <View style={[styles.container]}>
        <Text style={[styles.text]}>All prayers finished</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{timer.name} in</Text>
      <Animated.Text style={[styles.timer, animatedStyle]}>{formatTime(timer.timeLeft)}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: STYLES.timer.height,
    marginBottom: 40,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 5,
    color: COLORS.textSecondary,
  },
  timer: {
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    fontFamily: TEXT.family.medium,
  },
});

import * as Haptics from 'expo-haptics';
import { useAtomValue, useSetAtom } from 'jotai';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import ProgressBar from './ProgressBar';

import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, STYLES, TEXT } from '@/shared/constants';
import { formatTime } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { standardTimerAtom, extraTimerAtom, overlayTimerAtom } from '@/stores/timer';
import { progressBarVisibleAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Timer({ type }: Props) {
  const { isStandard } = useSchedule(type);

  const overlay = useAtomValue(overlayAtom);
  const setProgressBarVisible = useSetAtom(progressBarVisibleAtom);

  const timerAtom = overlay.isOn ? overlayTimerAtom : isStandard ? standardTimerAtom : extraTimerAtom;
  const timer = useAtomValue(timerAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
  }));

  const handlePress = () => {
    setProgressBarVisible((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Animated.View style={[styles.container]}>
      <Pressable onPress={handlePress} disabled={overlay.isOn}>
        <Text style={[styles.text]}>{timer.name} in</Text>
        <Animated.Text style={[styles.timer, animatedStyle]}>{formatTime(timer.timeLeft)}</Animated.Text>

        <ProgressBar type={type} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: STYLES.timer.height,
    marginBottom: 40,
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall,
    marginBottom: 3,
    color: COLORS.textSecondary,
  },
  timer: {
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    fontFamily: TEXT.family.medium,
    marginBottom: 16,
  },
});

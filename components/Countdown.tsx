import { useAtomValue } from 'jotai';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { COLORS, TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { standardCountdownAtom, extraCountdownAtom } from '@/stores/countdown';
import { overlayAtom } from '@/stores/overlay';

interface Props {
  type: ScheduleType;
}

export default function Countdown({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  const countdown = useAtomValue(isStandard ? standardCountdownAtom : extraCountdownAtom);
  const overlay = useAtomValue(overlayAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(overlay.isOn ? 1.5 : 1) }, { translateY: withTiming(overlay.isOn ? 5 : 0) }],
    fontFamily: overlay.isOn ? TEXT.famiy.medium : TEXT.famiy.regular,
  }));

  return (
    <Animated.View style={[styles.container]}>
      <Text style={[styles.text]}>{countdown.name} in</Text>
      <Animated.Text style={[styles.countdown, animatedStyle]}>{countdown.time}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  countdown: {
    color: 'white',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
  },
});

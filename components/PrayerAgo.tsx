import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

import { usePrayerAgo } from '@/hooks/usePrayerAgo';
import { TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';

interface Props {
  type: ScheduleType;
}

export default function PrayerAgo({ type }: Props) {
  const { prayerAgo, minutesElapsed, isReady: prayerAgoReady } = usePrayerAgo(type);
  const overlay = useAtomValue(overlayAtom);

  // Color state: 0=normal, 1=recent (≤5 mins)
  const isRecentValue = useSharedValue(minutesElapsed <= 5 ? 1 : 0);

  // Animate color transition with 500ms
  isRecentValue.value = withTiming(minutesElapsed <= 5 ? 1 : 0, {
    duration: 500,
    easing: Easing.linear,
  });

  // Fade out when overlay opens
  const prayerAgoOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(overlay.isOn ? 0 : 1, { duration: 150 }),
  }));

  // Smooth color transition
  const prayerAgoStyle = useAnimatedStyle(() => ({
    color: interpolateColor(isRecentValue.value, [0, 1], ['#a0c8ff80', '#d5e8ff']),
    backgroundColor: interpolateColor(isRecentValue.value, [0, 1], ['#63a9ff10', '#8d79ff2f']),
  }));

  if (!prayerAgoReady) return null;

  return <Animated.Text style={[styles.prayerAgo, prayerAgoOpacity, prayerAgoStyle]}>{prayerAgo}</Animated.Text>;
}

const styles = StyleSheet.create({
  prayerAgo: {
    textAlign: 'center',
    fontSize: TEXT.sizeSmall - 2,
    fontFamily: TEXT.family.regular,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'center',
  },
});

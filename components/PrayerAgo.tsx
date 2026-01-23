import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

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

  // Fade out when overlay opens
  const prayerAgoOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(overlay.isOn ? 0 : 1, { duration: 150 }),
  }));

  // Vibrant royal blue highlight for recent prayers (≤5 mins), otherwise normal style
  const isRecent = minutesElapsed <= 5;
  const prayerAgoStyle = useAnimatedStyle(() => ({
    color: isRecent ? '#a5b4fc' : '#a0c8ff80',
    backgroundColor: isRecent ? '#6366f130' : '#8ab4e810',
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

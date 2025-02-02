import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, TEXT } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';
import { refreshUIAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
  index: number;
  isOverlay?: boolean;
}

export default function PrayerTime({ type, index, isOverlay = false }: Props) {
  const refreshUI = useAtomValue(refreshUIAtom);

  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  // Force animation to respect new state immediately when refreshing
  useEffect(() => {
    AnimColor.animate(Prayer.ui.initialColorPos);
  }, [refreshUI]);

  if (Prayer.isNext) AnimColor.animate(1);

  if (!Schedule.isLastPrayerPassed && Schedule.schedule.nextIndex === 0 && index !== 0) {
    const delay = getCascadeDelay(index, type);
    AnimColor.animate(0, { delay });
  }

  return (
    <View style={[styles.container]}>
      <Animated.Text style={[styles.text, AnimColor.style]}>{Prayer.time}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    marginLeft: 15,
  },
});

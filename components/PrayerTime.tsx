import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationColor } from '@/hooks/useAnimation';
import { usePrayer } from '@/hooks/usePrayer';
import { useSchedule } from '@/hooks/useSchedule';
import { COLORS, TEXT } from '@/shared/constants';
import { getCascadeDelay } from '@/shared/prayer';
import { ScheduleType } from '@/shared/types';

interface Props {
  type: ScheduleType;
  index: number;
  isOverlay?: boolean;
}

export default function PrayerTime({ type, index, isOverlay = false }: Props) {
  const Schedule = useSchedule(type);
  const Prayer = usePrayer(type, index, isOverlay);
  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  if (Prayer.isNext) AnimColor.animate(1);

  if (!Schedule.isLastPrayerPassed && Schedule.schedule.nextIndex === 0 && index !== 0) {
    const delay = getCascadeDelay(index, type);
    AnimColor.animate(0, { delay });
  }

  return (
    <View style={[styles.container, { width: Prayer.isStandard ? 110 : 95 }]}>
      <Animated.Text style={[styles.text, AnimColor.style]}>{Prayer.time}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    width: '100%',
  },
});

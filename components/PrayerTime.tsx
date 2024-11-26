import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAtomValue } from 'jotai';

import { TEXT, ANIMATION } from '@/shared/constants';
import { extraScheduleAtom, standardScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import { isTimePassed } from '@/shared/time';
import { useColorAnimation } from '@/hooks/animations';
import { usePrayer } from '@/hooks/usePrayer';

interface Props { index: number; type: ScheduleType; }

export default function PrayerTime({ index, type }: Props) {
  const Prayer = usePrayer(index, type);

  // Derived State
  const onLoadColorPos = Prayer.isPassed || Prayer.isNext ? 1 : 0;
  const { style: colorStyle, animate: animateColor } = useColorAnimation(onLoadColorPos);

  if (Prayer.isNext) animateColor(1);

  return (
    <View style={[styles.container, { width: Prayer.isStandard ? 95 : 85 }]}>
      <Animated.Text style={[styles.text, colorStyle]}>{Prayer.prayer.time}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    textAlign: 'center',
    width: '100%',
  },
});
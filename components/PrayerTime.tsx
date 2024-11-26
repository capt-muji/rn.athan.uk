import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { useColorAnimation } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';

interface Props { index: number; type: ScheduleType; }

export default function PrayerTime({ index, type }: Props) {
  const Prayer = usePrayer(index, type);
  const ColorAnim = useColorAnimation(Prayer.ui.initialColorPos);

  if (Prayer.isNext) ColorAnim.animate(1);

  return (
    <View style={[styles.container, { width: Prayer.isStandard ? 95 : 85 }]}>
      <Animated.Text style={[styles.text, ColorAnim.style]}>{Prayer.prayer.time}</Animated.Text>
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
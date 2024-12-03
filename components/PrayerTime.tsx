import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAnimationColor } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { COLORS, TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

interface Props {
  type: ScheduleType;
  index: number;
}

export default function PrayerTime({ type, index }: Props) {
  const Prayer = usePrayer(type, index);
  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  if (Prayer.isNext) AnimColor.animate(1);

  return (
    <View style={[styles.container, { width: Prayer.isStandard ? 95 : 85 }]}>
      <Animated.Text style={[styles.text, AnimColor.style]}>{Prayer.time}</Animated.Text>
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

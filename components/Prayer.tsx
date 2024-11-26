import { StyleSheet, View, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRef } from 'react';

import { useColorAnimation } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { TEXT, PRAYER } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import Alert from './Alert';
import PrayerTime from './PrayerTime';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props { index: number; type: ScheduleType }

export default function Prayer({ index, type }: Props) {
  const Prayer = usePrayer(index, type);
  const ColorAnim = useColorAnimation(Prayer.ui.initialColorPos);

  const viewRef = useRef<View>(null);

  if (Prayer.isNext) ColorAnim.animate(1);

  return (
    <AnimatedPressable ref={viewRef} style={styles.container}>
      <Animated.Text style={[styles.text, styles.english, ColorAnim.style]}>{Prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, ColorAnim.style]}>{Prayer.arabic}</Animated.Text>
      <PrayerTime index={index} type={type} />
      <Alert index={index} type={type} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PRAYER.height,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    paddingLeft: PRAYER.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 15,
  },
});
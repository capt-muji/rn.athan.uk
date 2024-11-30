import { useRef } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import Alert from '@/components/Alert';
import PrayerTime from '@/components/PrayerTime';
import { useAnimationColor } from '@/hooks/useAnimations';
import { usePrayer } from '@/hooks/usePrayer';
import { TEXT, COLORS, STYLES } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setSelectedPrayerIndex, toggleOverlay } from '@/stores/actions';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  index: number;
  type: ScheduleType;
}

export default function Prayer({ index, type }: Props) {
  const Prayer = usePrayer(index, type);
  const AnimColor = useAnimationColor(Prayer.ui.initialColorPos, {
    fromColor: COLORS.inactivePrayer,
    toColor: COLORS.activePrayer,
  });

  const viewRef = useRef<View>(null);

  const handlePress = () => {
    setSelectedPrayerIndex(index, type);
    toggleOverlay();
  };

  if (Prayer.isNext) AnimColor.animate(1);

  return (
    <AnimatedPressable ref={viewRef} style={styles.container} onPress={handlePress}>
      <Animated.Text style={[styles.text, styles.english, AnimColor.style]}>{Prayer.english}</Animated.Text>
      <Animated.Text style={[styles.text, styles.arabic, AnimColor.style]}>{Prayer.arabic}</Animated.Text>
      <PrayerTime index={index} type={type} />
      <Alert index={index} type={type} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STYLES.prayer.height,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
  },
  english: {
    paddingLeft: STYLES.prayer.padding.left,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 15,
  },
});

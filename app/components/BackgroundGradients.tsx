import { LinearGradient } from 'expo-linear-gradient';
import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { COLORS } from '@/shared/constants';
import { scrollPositionAtom } from '@/stores/ui';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function BackgroundGradients() {
  const scrollPosition = useAtomValue(scrollPositionAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - scrollPosition,
  }));

  return (
    <>
      <LinearGradient
        colors={[COLORS.gradientScreen2Start, COLORS.gradientScreen2End]}
        locations={[0, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0.25 }}
        end={{ x: 1, y: 1 }}
      />

      <AnimatedLinearGradient
        colors={[COLORS.gradientScreen1Start, COLORS.gradientScreen1End]}
        locations={[0, 1]}
        style={[StyleSheet.absoluteFillObject, animatedStyle]}
        start={{ x: 0, y: 0.25 }}
        end={{ x: 1, y: 1 }}
      />
    </>
  );
}

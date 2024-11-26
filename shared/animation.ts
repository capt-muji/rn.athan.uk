
import { useSharedValue, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { COLORS } from './constants';

export const createColorAnimation = (initialColorPos: number) => ({
  colorPos: useSharedValue(initialColorPos)
});

export const createColorAnimatedStyle = (animation: ReturnType<typeof createColorAnimation>) => ({
  text: useAnimatedStyle(() => ({
    color: interpolateColor(
      animation.colorPos.value,
      [0, 1],
      [COLORS.inactivePrayer, COLORS.activePrayer]
    )
  }))
});

export type ColorAnimation = ReturnType<typeof createColorAnimation>;
export type ColorAnimatedStyle = ReturnType<typeof createColorAnimatedStyle>;
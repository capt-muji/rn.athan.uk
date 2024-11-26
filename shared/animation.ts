import { useSharedValue, useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import { COLORS } from './constants';

export const interpolateColorSharedValue = (value: number) => {
  'worklet';
  return interpolateColor(
    value,
    [0, 1],
    [COLORS.inactivePrayer, COLORS.activePrayer]
  );
};

export const createColorSharedValues = (initialColorPos: number) => ({
  colorPos: useSharedValue(initialColorPos)
});

export const createColorAnimatedStyle = (sharedValues: ReturnType<typeof createColorSharedValues>) => ({
  text: useAnimatedStyle(() => ({
    color: interpolateColorSharedValue(sharedValues.colorPos.value)
  }))
});

export type ColorAnimation = ReturnType<typeof createColorSharedValues>;
export type ColorAnimatedStyle = ReturnType<typeof createColorAnimatedStyle>;
import { useSharedValue, useAnimatedStyle, interpolateColor, SharedValue } from 'react-native-reanimated';
import { COLORS } from './constants';

export const interpolateColorSharedValue = (colorPos: SharedValue<number>) => {
  'worklet';
  return interpolateColor(
    colorPos.value,
    [0, 1],
    [COLORS.inactivePrayer, COLORS.activePrayer]
  );
};

export const colorSharedValues = (initialColorPos: number) => ({
  colorPos: useSharedValue(initialColorPos)
});

export const colorAnimatedStyle = (sharedValues: ReturnType<typeof colorSharedValues>) => useAnimatedStyle(() => ({
  color: interpolateColorSharedValue(sharedValues.colorPos)
}));

export type ColorAnimation = ReturnType<typeof colorSharedValues>;
export type ColorAnimatedStyle = ReturnType<typeof colorAnimatedStyle>;
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useAtomValue } from 'jotai';
import { useMemo, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { interpolateColor, useSharedValue } from 'react-native-reanimated';

import { COLORS } from '@/shared/constants';
import { pagePositionAtom } from '@/stores/ui';

export default function GradientBackground() {
  const position = useAtomValue(pagePositionAtom);

  const { height, width } = Dimensions.get('screen');

  const colors = useMemo(
    () => ({
      start: [COLORS.gradientScreen1Start, COLORS.gradientScreen2Start],
      end: [COLORS.gradientScreen1End, COLORS.gradientScreen2End],
    }),
    []
  );

  const startColorValue = useSharedValue(colors.start[0]);
  const endColorValue = useSharedValue(colors.end[0]);

  useEffect(() => {
    startColorValue.value = interpolateColor(position, [0, 1], colors.start);
    endColorValue.value = interpolateColor(position, [0, 1], colors.end);
  }, [position]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { height: height }]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={[startColorValue.value, endColorValue.value]}
        />
      </Rect>
    </Canvas>
  );
}

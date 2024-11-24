import { StyleSheet, useWindowDimensions } from 'react-native';
import { useAtomValue } from 'jotai';
import { pagePositionAtom } from '@/stores/store';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { interpolateColor, useSharedValue } from 'react-native-reanimated';
import { useMemo, useEffect, useState } from 'react';
import { COLORS } from '@/shared/constants';

export default function GradientBackground() {
  const { width, height } = useWindowDimensions();
  const position = useAtomValue(pagePositionAtom);
  const [currentStart, setCurrentStart] = useState(COLORS.gradientScreen1Start);
  const [currentEnd, setCurrentEnd] = useState(COLORS.gradientScreen1End);

  const colors = useMemo(() => ({
    start: [COLORS.gradientScreen1Start, COLORS.gradientScreen2Start],
    end: [COLORS.gradientScreen1End, COLORS.gradientScreen2End],
  }), []);

  const startColorValue = useSharedValue(colors.start[0]);
  const endColorValue = useSharedValue(colors.end[0]);

  useEffect(() => {
    startColorValue.value = interpolateColor(position, [0, 1], colors.start);
    endColorValue.value = interpolateColor(position, [0, 1], colors.end);
    setCurrentStart(startColorValue.value);
    setCurrentEnd(endColorValue.value);
  }, [position]);

  return (
    <Canvas style={[StyleSheet.absoluteFillObject]}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={[currentStart, currentEnd]}
        />
      </Rect>
    </Canvas>
  );
}
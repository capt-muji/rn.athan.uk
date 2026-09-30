import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { StreetShape } from '@/hooks/useQiblaMap';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { COLORS, SIZE, SPACING } from '@/shared/constants';
import type { Position } from '@/shared/qibla';

import { projectToCanvas, rayEndpoint } from './mapProjection';

interface QiblaMapProps {
  /** Where the user is standing, which is the centre of the picture */
  here: Position;
  /** The qibla, in degrees clockwise from true north */
  bearing: number;
  /** The road lines to draw, as ground positions */
  roads: StreetShape[];
}

const STREET_WIDTH = 0.006;
const RAY_WIDTH = 0.012;
const HERE_RADIUS = 0.018;

/**
 * The streets around the user, with the qibla drawn across them
 *
 * North is always up and the picture never rotates: rotating it would need the magnetometer this screen
 * exists to replace, and a map that turns with a wrong heading is wrong in the same way the dial was.
 *
 * Memoised on its own inputs, because `react-native-svg` re-walks its whole drawing pipeline on any attribute
 * change, measured at 1.33 to 1.87 ms per path on the floor device. Nothing here animates, so it records once.
 */
const QiblaMap = memo(({ here, bearing, roads }: QiblaMapProps) => {
  const { width } = useWindowDimensions();
  const canvas = Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2;
  const ray = rayEndpoint(bearing, canvas);

  return (
    <View style={styles.container}>
      <Svg width={canvas} height={canvas}>
        <G testID='qibla-streets'>
          {roads.map((road) => {
            const points = road.points.map((point) => projectToCanvas(here, point, canvas));
            const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');

            return (
              <Path
                key={path}
                d={path}
                stroke={COLORS.text.muted}
                strokeWidth={canvas * STREET_WIDTH}
                strokeLinecap='round'
                fill='none'
              />
            );
          })}
        </G>

        <Line
          testID='qibla-ray'
          x1={canvas / 2}
          y1={canvas / 2}
          x2={ray.x}
          y2={ray.y}
          stroke={COLORS.prayer.activeBackground}
          strokeWidth={canvas * RAY_WIDTH}
          strokeLinecap='round'
        />

        <Circle
          testID='qibla-here'
          cx={canvas / 2}
          cy={canvas / 2}
          r={canvas * HERE_RADIUS}
          fill={COLORS.text.primary}
        />
      </Svg>
    </View>
  );
});

QiblaMap.displayName = 'QiblaMap';

export default QiblaMap;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Rect, Text } from 'react-native-svg';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { ANIMATION, COLORS, SIZE, SPACING } from '@/shared/constants';

import { DIAL_LABELS, DIAL_TICKS, dialPoint } from './dialGeometry';

interface DialProps {
  /** Where the Kaaba lies, in degrees clockwise from true north */
  bearing: number;
  /** The phone's heading, accumulated so it never wraps, since an interpolation runs between the numbers it is given */
  heading: SharedValue<number>;
}

const RIM_INSET = 0.03;
const LABEL_RADIUS = 0.82;
const LABEL_SIZE = 0.075;
const MARKER_RADIUS = 0.62;
const MARKER_SIZE = 0.11;
const MARKER_BAND = 0.2;
const MARKER_CORNER = 0.12;
/** Short enough to clear the labels, which sit at LABEL_RADIUS and would otherwise be hidden under it at north */
const MARK_LENGTH = 0.04;
const STROKE = 0.008;

/**
 * The compass face
 *
 * Memoised because re-recording it is the one thing that cannot happen: react-native-svg re-walks its whole drawing
 * pipeline on any attribute change, measured at 40 to 56ms for 30 paths on the floor device (`components/ui/Masjid.tsx`),
 * which is several frames for one turn of an 84-element face.
 */
const Face = memo(({ size, bearing }: { size: number; bearing: number }) => {
  const radius = size / 2;
  const rim = radius * (1 - RIM_INSET);
  const marker = dialPoint(bearing, radius * MARKER_RADIUS);
  const markerSize = radius * MARKER_SIZE;

  return (
    <Svg width={size} height={size} viewBox={`${-radius} ${-radius} ${size} ${size}`}>
      {DIAL_TICKS.map((tick) => {
        const outer = dialPoint(tick.angle, rim);
        const inner = dialPoint(tick.angle, rim * (1 - tick.length));

        return (
          <Line
            key={tick.angle}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke={tick.labelled ? COLORS.text.primary : COLORS.text.muted}
            strokeWidth={radius * STROKE}
            strokeLinecap='round'
          />
        );
      })}

      {DIAL_LABELS.map((label) => {
        const at = dialPoint(label.angle, radius * LABEL_RADIUS);

        return (
          <Text
            key={label.angle}
            x={at.x}
            y={at.y}
            fill={COLORS.text.secondary}
            fontSize={radius * LABEL_SIZE}
            textAnchor='middle'
            alignmentBaseline='central'>
            {label.text}
          </Text>
        );
      })}

      <Line
        x1={0}
        y1={0}
        x2={marker.x}
        y2={marker.y}
        stroke={COLORS.icon.primary}
        strokeWidth={radius * STROKE * 2}
        strokeLinecap='round'
      />

      <G transform={`translate(${marker.x} ${marker.y}) rotate(${-bearing})`}>
        <Rect
          x={-markerSize / 2}
          y={-markerSize / 2}
          width={markerSize}
          height={markerSize}
          rx={markerSize * MARKER_CORNER}
          fill={COLORS.icon.primary}
        />
        {/* The kiswah's band as negative space, which is how the Kaaba stays legible once it is this small */}
        <Rect
          x={-markerSize / 2}
          y={(-markerSize * MARKER_BAND) / 2}
          width={markerSize}
          height={markerSize * MARKER_BAND}
          fill={COLORS.surface.sheet}
        />
      </G>
    </Svg>
  );
});

/**
 * The qibla compass face, turning under a fixed mark
 *
 * The face carries the Kaaba, so bringing the Kaaba under the mark is facing the qibla. Only the face turns, as one
 * transform on one recorded layer, which is a compositor matrix multiply rather than a redraw.
 */
export default function Dial({ bearing, heading }: DialProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(width, SIZE.contentMaxWidth) - SPACING.xl * 2;

  // First evaluation snaps, so the face draws at the phone's real heading rather than spinning to it from north
  // (ai/AGENTS.md: no mount-time visual settling)
  const isFirstEvaluation = useSharedValue(true);
  const rotation = useDerivedValue(() => {
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return -heading.value;
    }

    return withTiming(-heading.value, { duration: ANIMATION.durationFade });
  });

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={[styles.dial, { width: size, height: size }]}>
      <Animated.View testID='qibla-face' style={faceStyle}>
        <Face size={size} bearing={bearing} />
      </Animated.View>
      <View style={[styles.mark, { height: size * MARK_LENGTH, width: size * STROKE * 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  mark: {
    backgroundColor: COLORS.text.primary,
    borderRadius: SPACING.xxs,
    position: 'absolute',
    top: 0,
  },
});

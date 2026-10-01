import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect, Text } from 'react-native-svg';

import { ANIMATION, COLORS, TEXT } from '@/shared/constants';
import { arcPath, CARDINALS, FACE, facePoint, qiblaLinePath, rubElHizbPath, TICKS } from '@/shared/qiblaCompass';

type Palette = typeof COLORS.qibla.away;

interface QiblaCompassProps {
  size: number;
  /** Where the Kaaba lies, in degrees clockwise from true north */
  bearing: number;
  /** The phone's heading, unwrapped so a turn past north never spins the dial the long way round */
  heading: SharedValue<number>;
  /** Whether the phone is on the line, which is what turns the whole instrument gold */
  aligned: SharedValue<boolean>;
}

/** The structure colour at one of the alphas the design gives it */
const structure = (palette: Palette, alpha: number): string => `rgba(${palette.structure}, ${alpha})`;

/**
 * The Kaaba, set into the dial's rim at the qibla's own bearing like a bezel marker.
 *
 * Squared to the rim rather than kept upright on the card, so its roof lies flat against the outer circle at every
 * heading. It is engraving: it turns with the plate and never animates, which is also why it costs nothing to draw.
 */
const Kaaba = ({ radius, bearing, palette }: { radius: number; bearing: number; palette: Palette }) => {
  const at = facePoint(bearing, radius * FACE.kaaba);
  const box = radius * FACE.kaabaSize;
  const unit = radius * FACE.stroke;

  return (
    <G transform={`rotate(${bearing} ${at.x} ${at.y}) translate(${at.x} ${at.y})`}>
      <Rect
        x={-box / 2}
        y={-box / 2}
        width={box}
        height={box}
        rx={box * 0.07}
        fill={palette.kaaba}
        stroke={palette.accent}
        strokeWidth={unit * 2.2}
      />
      {/* The kiswah's band and door, which is what makes a small square read as the Kaaba */}
      <Rect x={-box / 2} y={-box * 0.17} width={box} height={box * 0.2} fill={palette.accent} />
      <Rect x={box * 0.07} y={box * 0.06} width={box * 0.17} height={box * 0.33} fill={palette.accent} />
    </G>
  );
};

/**
 * The dial: the engraved plate that turns under a fixed arrow, in ONE palette.
 *
 * Memoised because re-recording it is the one thing that must not happen: react-native-svg re-walks its entire
 * drawing pipeline on any attribute change, which is several frames for a plate of this many elements. The two
 * palettes are stacked and cross-faded instead, so turning gold costs one opacity and never a redraw.
 *
 * Everything here is drawn in the DIAL's own space, so it all turns together: the letters keep their bearings the
 * way a real compass card does, rather than pivoting about their own points.
 */
const Dial = memo(({ size, bearing, palette }: { size: number; bearing: number; palette: Palette }) => {
  const radius = size / 2;
  const unit = radius * FACE.stroke;

  return (
    <Svg width={size} height={size} viewBox={`${-radius} ${-radius} ${size} ${size}`}>
      <Circle r={radius * FACE.rim} fill={palette.face} stroke={structure(palette, 0.92)} strokeWidth={unit * 2.2} />
      <Circle r={radius * FACE.ring} fill='none' stroke={structure(palette, 0.5)} strokeWidth={unit * 1.1} />

      {TICKS.map(({ angle, weight }) => {
        const outer = facePoint(angle, radius * FACE.tick);
        const inner = facePoint(angle, radius * (FACE.tick - FACE.tickLength[weight]));
        const alpha = weight === 'major' ? 0.95 : weight === 'mid' ? 0.62 : 0.38;
        const width = weight === 'major' ? 2.4 : weight === 'mid' ? 1.56 : 1.2;

        return (
          <Line
            key={angle}
            x1={outer.x}
            y1={outer.y}
            x2={inner.x}
            y2={inner.y}
            stroke={structure(palette, alpha)}
            strokeWidth={unit * width}
            strokeLinecap='round'
          />
        );
      })}

      {/* Where Makkah lies, inlaid into the rim's own stroke */}
      <Path
        d={arcPath(bearing - FACE.arcSpread, bearing + FACE.arcSpread, radius * FACE.arc)}
        fill='none'
        stroke={palette.accent}
        strokeWidth={unit * 2.2}
        strokeLinecap='round'
      />

      <Circle
        r={radius * FACE.medallion}
        fill={palette.medallion}
        stroke={structure(palette, 0.5)}
        strokeWidth={unit * 1.2}
      />

      {CARDINALS.map(({ angle, letter }) => {
        const at = facePoint(angle, radius * FACE.cardinal);

        return (
          <Text
            key={letter}
            x={at.x}
            y={at.y}
            fill={palette.ink}
            fontSize={radius * FACE.cardinalSize}
            fontFamily={TEXT.family.medium}
            textAnchor='middle'
            alignmentBaseline='central'>
            {letter}
          </Text>
        );
      })}

      <Kaaba radius={radius} bearing={bearing} palette={palette} />
    </Svg>
  );
});

/**
 * The fixed instrument: the arrow the user aims, and the jewel it is hinged on.
 *
 * Never turns. It reads straight up the phone, which is the direction the user is facing, so alignment is the
 * Kaaba arriving beneath it.
 */
const Needle = memo(({ size, palette }: { size: number; palette: Palette }) => {
  const radius = size / 2;
  const unit = radius * FACE.stroke;

  return (
    <Svg width={size} height={size} viewBox={`${-radius} ${-radius} ${size} ${size}`}>
      <Path d={qiblaLinePath(radius)} fill={palette.accent} />
      {/* An open outline, so the line runs through it unbroken */}
      <Path
        d={rubElHizbPath(radius * FACE.jewel, -22.5)}
        fill='none'
        stroke={structure(palette, 1)}
        strokeWidth={unit * 1.5}
      />
      <Path
        d={rubElHizbPath(radius * FACE.jewelInner, 0)}
        fill='none'
        stroke={structure(palette, 0.5)}
        strokeWidth={unit * 0.9}
      />
      <Circle r={radius * FACE.hub} fill={palette.accent} />
    </Svg>
  );
});

/**
 * The qibla compass: a turning dial under a fixed arrow.
 *
 * The user turns until the Kaaba arrives beneath the arrow. Nothing has to be read, which is the point: the haptic
 * and the gold fire together off the same arithmetic, never off a measurement of the drawing.
 */
export default function QiblaCompass({ size, bearing, heading, aligned }: QiblaCompassProps) {
  // First evaluation snaps, so the dial draws at the phone's real heading rather than spinning to it from north
  const isFirstEvaluation = useSharedValue(true);
  const turn = useDerivedValue(() => {
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return heading.value;
    }

    return withTiming(heading.value, { duration: ANIMATION.durationFade });
  });

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-turn.value}deg` }] }));
  const goldStyle = useAnimatedStyle(() => ({
    opacity: withTiming(aligned.value ? 1 : 0, { duration: ANIMATION.duration }),
  }));

  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      <Animated.View testID='qibla-dial' style={dialStyle}>
        <Dial size={size} bearing={bearing} palette={COLORS.qibla.away} />
        <Animated.View testID='qibla-dial-gold' style={[StyleSheet.absoluteFill, goldStyle]}>
          <Dial size={size} bearing={bearing} palette={COLORS.qibla.facing} />
        </Animated.View>
      </Animated.View>
      <View style={StyleSheet.absoluteFill} pointerEvents='none'>
        <Needle size={size} palette={COLORS.qibla.away} />
        <Animated.View style={[StyleSheet.absoluteFill, goldStyle]}>
          <Needle size={size} palette={COLORS.qibla.facing} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

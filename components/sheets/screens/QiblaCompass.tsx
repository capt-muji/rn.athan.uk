import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Polygon, Rect, Text } from 'react-native-svg';

import { ANIMATION, COLORS, TEXT } from '@/shared/constants';
import { FIGURE_CANVAS, kaabaShapes } from '@/shared/kaabaFigure';
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
 * The Kaaba, standing on the dial's rim at the qibla's own bearing, drawn as a cartoon rather than a photograph.
 *
 * Three flat faces in cabinet projection and one gold line round the whole figure. The only modelling is a single
 * flat darkening on each receding face, which is how a cartoon says "solid" without gloss or gradients. No
 * rainspout: it reaches off the roof as a stray tag at marker size and reads as a fault in the outline.
 *
 * Held UPRIGHT on the card rather than squared to the rim. A flat square survives being squared because a square
 * looks the same at any rotation; a figure with a roof and a ground does not, and squaring it stands the building
 * on its head for a third of the compass.
 */
const Kaaba = memo(({ box, palette }: { box: number; palette: Palette }) => {
  const shapes = kaabaShapes(box);
  const outline = Math.max(0.6, box * 0.041);
  const canvas = box * FIGURE_CANVAS;

  return (
    <Svg width={canvas} height={canvas} viewBox={`${-canvas / 2} ${-canvas / 2} ${canvas} ${canvas}`}>
      <Polygon points={shapes.flank} fill={palette.kaaba} />
      <Polygon points={shapes.flank} fill='#000000' fillOpacity={0.28} />
      <Polygon points={shapes.front} fill={palette.kaaba} />
      <Polygon points={shapes.roof} fill={palette.kaaba} />
      <Polygon points={shapes.roof} fill='#ffffff' fillOpacity={0.16} />

      <Polygon points={shapes.belt.flank} fill={palette.accent} />
      <Polygon points={shapes.belt.flank} fill='#000000' fillOpacity={0.28} />
      <Polygon points={shapes.belt.front} fill={palette.accent} />

      <Rect
        x={shapes.door.x}
        y={shapes.door.y}
        width={shapes.door.width}
        height={shapes.door.height}
        fill={palette.accent}
      />

      <Path d={shapes.silhouette} fill='none' stroke={palette.accent} strokeWidth={outline} strokeLinejoin='round' />
    </Svg>
  );
});

/**
 * The dial: the engraved plate that turns under a fixed arrow, in ONE palette.
 *
 * Memoised because re-recording it is the one thing that must not happen: react-native-svg re-walks its entire
 * drawing pipeline on any attribute change, which is several frames for a plate of this many elements. The two
 * palettes are stacked and cross-faded instead, so turning gold costs one opacity and never a redraw.
 *
 * Everything here is drawn in the DIAL's own space, so it all turns together: the letters keep their bearings the
 * way a real compass card does, rather than pivoting about their own points. The Kaaba is the one exception and
 * rides its own counter-turning layer, because a building has an up and the plate does not.
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
  const radius = size / 2;
  // First evaluation snaps, so the dial draws at the phone's real heading rather than spinning to it from north
  const isFirstEvaluation = useSharedValue(true);
  // The platform gates its heading at 2 degrees, so the readings arrive as steps and this is what smooths them. It
  // can settle because that same gate means a still phone sends nothing, which a 10ms sensor stream never allowed
  const turn = useDerivedValue(() => {
    if (isFirstEvaluation.value) {
      isFirstEvaluation.value = false;
      return heading.value;
    }

    return withTiming(heading.value, { duration: ANIMATION.durationFade });
  });

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-turn.value}deg` }] }));
  // The marker swings out to where the plate has carried its bearing, then stands straight back up, so the
  // building keeps its own up at every heading. Three transforms on one layer, and never a redraw of the figure
  const markerStyle = useAnimatedStyle(() => {
    const swing = bearing - turn.value;

    return {
      transform: [{ rotate: `${swing}deg` }, { translateY: -radius * FACE.kaaba }, { rotate: `${-swing}deg` }],
    };
  });
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
      {/* The marker rides the plate's bearing but stands upright on the card, so it is its own layer */}
      <View style={[StyleSheet.absoluteFill, styles.stage]} pointerEvents='none'>
        <Animated.View testID='qibla-kaaba' style={markerStyle}>
          <Kaaba box={radius * FACE.kaabaSize} palette={COLORS.qibla.away} />
          <Animated.View style={[StyleSheet.absoluteFill, goldStyle]}>
            <Kaaba box={radius * FACE.kaabaSize} palette={COLORS.qibla.facing} />
          </Animated.View>
        </Animated.View>
      </View>
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

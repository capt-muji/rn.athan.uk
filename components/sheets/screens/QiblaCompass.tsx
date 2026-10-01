import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polygon, Rect, Stop, Text } from 'react-native-svg';

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
 * The Kaaba, standing on the dial's rim at the qibla's own bearing, drawn as the building rather than as a square.
 *
 * Two lit faces and a roof in cabinet projection, carrying the hizam and its inscription, the door, the Black
 * Stone and the mizab at the heights they occupy on the building. It is engraving: it never animates, so the
 * detail costs one record at mount and nothing per frame.
 *
 * Held UPRIGHT on the card rather than squared to the rim. A flat square survives being squared because a square
 * looks the same at any rotation; a figure with a roof and a ground does not, and squaring it stands the building
 * on its head for a third of the compass.
 */
const Kaaba = memo(({ box, palette, idPrefix }: { box: number; palette: Palette; idPrefix: string }) => {
  const shapes = kaabaShapes(box);
  const hair = Math.max(0.3, box * 0.005);
  const rim = Math.max(0.5, box * 0.011);
  const id = (name: string) => `${idPrefix}-${name}`;
  // The mizab reaches past the cube, so the canvas is wider than the box the figure is fitted to
  const canvas = box * FIGURE_CANVAS;

  return (
    <Svg width={canvas} height={canvas} viewBox={`${-canvas / 2} ${-canvas / 2} ${canvas} ${canvas}`}>
      <Defs>
        <LinearGradient id={id('front')} x1='0' y1='0' x2='0.25' y2='1'>
          <Stop offset='0' stopColor='#ffffff' stopOpacity='0.16' />
          <Stop offset='0.6' stopColor='#ffffff' stopOpacity='0.05' />
          <Stop offset='1' stopColor='#000000' stopOpacity='0.14' />
        </LinearGradient>
        <LinearGradient id={id('flank')} x1='0' y1='0' x2='1' y2='0.2'>
          <Stop offset='0' stopColor='#000000' stopOpacity='0.36' />
          <Stop offset='1' stopColor='#000000' stopOpacity='0.64' />
        </LinearGradient>
        <LinearGradient id={id('roof')} x1='0' y1='1' x2='0.4' y2='0'>
          <Stop offset='0' stopColor='#ffffff' stopOpacity='0.24' />
          <Stop offset='1' stopColor='#ffffff' stopOpacity='0.09' />
        </LinearGradient>
        <LinearGradient id={id('belt')} x1='0' y1='0' x2='0' y2='1'>
          <Stop offset='0' stopColor='#000000' stopOpacity='0.3' />
          <Stop offset='0.3' stopColor='#ffffff' stopOpacity='0.34' />
          <Stop offset='0.7' stopColor='#ffffff' stopOpacity='0.02' />
          <Stop offset='1' stopColor='#000000' stopOpacity='0.36' />
        </LinearGradient>
        <LinearGradient id={id('door')} x1='0' y1='0' x2='1' y2='0.5'>
          <Stop offset='0' stopColor='#ffffff' stopOpacity='0.4' />
          <Stop offset='0.45' stopColor='#ffffff' stopOpacity='0.03' />
          <Stop offset='1' stopColor='#000000' stopOpacity='0.34' />
        </LinearGradient>
      </Defs>

      {/* The mizab sits behind the cube, so the roof's own edge cuts it where it leaves the building */}
      <Polygon points={shapes.spoutLip} fill={palette.accent} />
      <Polygon points={shapes.spoutLip} fill='#000000' fillOpacity={0.42} />
      <Polygon points={shapes.spout} fill={palette.accent} />
      <Polygon points={shapes.spout} fill='#000000' fillOpacity={0.12} />

      <Polygon points={shapes.flank} fill={palette.kaaba} />
      <Polygon points={shapes.flank} fill={`url(#${id('flank')})`} />
      <Polygon points={shapes.front} fill={palette.kaaba} />
      <Polygon points={shapes.front} fill={`url(#${id('front')})`} />
      <Polygon points={shapes.roof} fill={palette.kaaba} />
      <Polygon points={shapes.roof} fill={`url(#${id('roof')})`} />

      <Path d={shapes.seams} stroke='#000000' strokeOpacity={0.18} strokeWidth={hair} fill='none' />

      <Polygon points={shapes.plinth.flank} fill='#ffffff' fillOpacity={0.05} />
      <Polygon points={shapes.plinth.front} fill='#ffffff' fillOpacity={0.14} />

      <Polygon points={shapes.belt.flank} fill={palette.accent} />
      <Polygon points={shapes.belt.flank} fill='#000000' fillOpacity={0.52} />
      <Polygon points={shapes.belt.front} fill={palette.accent} />
      <Path
        d={shapes.words}
        stroke='#000000'
        strokeOpacity={0.3}
        strokeWidth={hair * 1.1}
        strokeLinecap='round'
        fill='none'
      />
      <Polygon points={shapes.braidTop} fill='#ffffff' fillOpacity={0.26} />
      <Polygon points={shapes.braidBottom} fill='#000000' fillOpacity={0.22} />
      <Polygon points={shapes.belt.front} fill={`url(#${id('belt')})`} />

      <Rect
        x={shapes.door.x}
        y={shapes.door.y}
        width={shapes.door.width}
        height={shapes.door.height}
        fill={palette.accent}
      />
      <Rect
        x={shapes.doorPanel.x}
        y={shapes.doorPanel.y}
        width={shapes.doorPanel.width}
        height={shapes.doorPanel.height}
        fill='#000000'
        fillOpacity={0.22}
      />
      <Rect
        x={shapes.door.x}
        y={shapes.door.y}
        width={shapes.door.width}
        height={shapes.door.height}
        fill={`url(#${id('door')})`}
      />

      <Circle cx={shapes.stone.x} cy={shapes.stone.y} r={shapes.stone.r} fill={palette.accent} />
      <Circle cx={shapes.stone.x} cy={shapes.stone.y} r={shapes.stone.r * 0.42} fill='#000000' fillOpacity={0.5} />

      <Path d={shapes.eave} stroke={palette.accent} strokeOpacity={0.4} strokeWidth={hair} fill='none' />
      <Path d={shapes.corner} stroke='#000000' strokeOpacity={0.32} strokeWidth={hair} fill='none' />
      <Path d={shapes.silhouette} fill='none' stroke={palette.accent} strokeWidth={rim} strokeLinejoin='round' />
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
          <Kaaba box={radius * FACE.kaabaSize} palette={COLORS.qibla.away} idPrefix='kaaba-away' />
          <Animated.View style={[StyleSheet.absoluteFill, goldStyle]}>
            <Kaaba box={radius * FACE.kaabaSize} palette={COLORS.qibla.facing} idPrefix='kaaba-facing' />
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

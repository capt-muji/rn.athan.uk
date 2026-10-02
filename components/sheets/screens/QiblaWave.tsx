import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { COLORS } from '@/shared/constants';
import { phoneBody, phoneScreen, WAVE, waveHeading, wavePath, wavePoint, waveTrail } from '@/shared/qiblaWave';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const PALETTE = COLORS.qibla.away;

/** One unhurried pass of the figure: fast enough to read as a motion, slow enough to copy by hand */
const WAVE_DURATION = 3200;

/**
 * The figure of eight the user waves the phone through, drawn as a phone trailing a comet's tail.
 *
 * A phone rather than a dot, because the instruction is to move THIS OBJECT: a dot teaches a shape where the
 * device teaches the gesture. It banks through each turn, scaled edge-on about its own long axis, so the figure
 * asks for a wrist that rolls like an aircraft rather than a hand sliding flat through one plane.
 *
 * The tail is what makes the shape readable: the phone alone is a dot moving, where a trail leaves the whole
 * figure visible for a moment after it has passed, so a user who looks up mid-loop still sees what to copy.
 *
 * THE GLOW IS THREE STACKED STROKES, not a shadow. Android's Glance and React Native's elevation cannot blur a
 * stroke, and `shadow*` props do not cross to Android at all, so a real glow would be iOS-only. Three passes of
 * the same path at falling width and opacity read as a glow on both platforms and cost three paints of one path.
 *
 * Shown only while the compass waits for the heading to converge, which is what waving the phone brings about.
 * Mounted for exactly that long, so the loop is never ticking behind the compass (Performance Design Rule 7).
 */
export default function QiblaWave({ size }: { size: number }) {
  const figureWidth = size * WAVE.width;
  const figureHeight = size * WAVE.height;
  const body = phoneBody(size);
  const screen = phoneScreen(size);
  const canvasWidth = figureWidth + body.height;
  const canvasHeight = figureHeight + body.height;

  const progress = useSharedValue(0);

  useEffect(() => {
    // Starts the motion and never places the phone, which first-frames settled at progress 0 on its own
    progress.value = withRepeat(withTiming(1, { duration: WAVE_DURATION, easing: Easing.linear }), -1);

    // withRepeat(-1) would otherwise keep driving the UI thread once the compass has replaced this
    return () => cancelAnimation(progress);
  }, [progress]);

  const trailProps = useAnimatedProps(() => ({
    d: waveTrail(progress.value, figureWidth, figureHeight),
  }));

  // Travels and TURNS, never scales: the phone keeps its dimensions the whole way round, and facing along the
  // curve is what keeps the trail leaving its bottom edge
  const phoneStyle = useAnimatedStyle(() => {
    const at = wavePoint(progress.value, figureWidth, figureHeight);

    return {
      transform: [
        { translateX: at.x },
        { translateY: at.y },
        { rotate: `${waveHeading(progress.value, figureWidth, figureHeight)}deg` },
      ],
    };
  });

  return (
    // A drawn gesture says nothing a screen reader can use, and each platform's reader reads only its own prop
    <View
      style={[styles.stage, { width: canvasWidth, height: canvasHeight }]}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'>
      <Svg
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`${-canvasWidth / 2} ${-canvasHeight / 2} ${canvasWidth} ${canvasHeight}`}>
        <Path
          d={wavePath(figureWidth, figureHeight)}
          fill='none'
          stroke={`rgba(${PALETTE.structure}, 0.16)`}
          strokeWidth={size * WAVE.stroke}
          strokeLinecap='round'
        />
        <AnimatedPath
          animatedProps={trailProps}
          fill='none'
          stroke={PALETTE.accent}
          strokeWidth={size * WAVE.trail.halo}
          strokeLinecap='round'
          opacity={0.12}
        />
        <AnimatedPath
          animatedProps={trailProps}
          fill='none'
          stroke={PALETTE.accent}
          strokeWidth={size * WAVE.trail.halo * 0.5}
          strokeLinecap='round'
          opacity={0.3}
        />
        <AnimatedPath
          animatedProps={trailProps}
          fill='none'
          stroke={PALETTE.accent}
          strokeWidth={size * WAVE.trail.core}
          strokeLinecap='round'
          opacity={0.85}
        />
      </Svg>
      {/* Views rather than animated SVG nodes: react-native-svg re-walks its whole drawing pipeline on any
          attribute change, where a transform on a layer is composited */}
      <Animated.View
        testID='qibla-wave-phone'
        style={[
          styles.phone,
          { width: body.width, height: body.height, borderRadius: body.radius, borderWidth: size * WAVE.stroke },
          phoneStyle,
        ]}>
        <View style={[styles.screen, { width: screen.width, height: screen.height, borderRadius: screen.radius }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: {
    alignItems: 'center',
    backgroundColor: PALETTE.kaaba,
    borderColor: PALETTE.accent,
    justifyContent: 'center',
    position: 'absolute',
  },
  screen: {
    backgroundColor: `rgba(${PALETTE.structure}, 0.2)`,
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

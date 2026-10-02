import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path, Polygon } from 'react-native-svg';

import { COLORS } from '@/shared/constants';
import { phoneSlab, WAVE, waveLean, wavePath, wavePoint, waveTrail, waveYaw } from '@/shared/qiblaWave';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedGroup = Animated.createAnimatedComponent(G);

const PALETTE = COLORS.qibla.away;

/** One unhurried pass of the figure: fast enough to read as a motion, slow enough to copy by hand */
const WAVE_DURATION = 3200;

/**
 * The figure of eight the user waves the phone through, drawn as a phone trailing a comet's tail.
 *
 * A phone rather than a dot, because the instruction is to move THIS OBJECT: a dot teaches a shape where the
 * device teaches the gesture.
 *
 * THE PHONE IS A SOLID, not a flat card. A card rotated toward edge-on vanishes, which is exactly what the owner
 * saw, so it is drawn the way the Kaaba is: a front face that never narrows, a flank that recedes as the phone
 * turns, and a roof joining them. The front always faces the user, so the trail always leaves the phone's foot.
 *
 * THE GLOW IS THREE STACKED STROKES, not a shadow. Android cannot blur a stroke and React Native's `shadow*`
 * props do not cross to it at all, so a real glow would be iOS-only. Three passes of one path at falling width
 * and opacity read as a glow on both platforms and cost three paints of a path rebuilt once per frame.
 *
 * `progress` is how much of the asked-for wave the user has actually performed, which the ring behind the figure
 * draws. It is what turns the hint from an instruction nobody checked into a thing with an end.
 *
 * Shown only while the compass waits, and mounted for exactly that long, so the loop is never ticking behind the
 * compass (Performance Design Rule 7).
 */
export default function QiblaWave({ size, progress }: { size: number; progress: number }) {
  const figureWidth = size * WAVE.width;
  const figureHeight = size * WAVE.height;
  const slabAt = (yaw: number) => phoneSlab(size, yaw);
  const canvasWidth = figureWidth + size * WAVE.phone.height;
  const canvasHeight = figureHeight + size * WAVE.phone.height;

  const travel = useSharedValue(0);

  useEffect(() => {
    // Starts the motion and never places the phone, which first-frames settled at travel 0 on its own
    travel.value = withRepeat(withTiming(1, { duration: WAVE_DURATION, easing: Easing.linear }), -1);

    // withRepeat(-1) would otherwise keep driving the UI thread once the compass has replaced this
    return () => cancelAnimation(travel);
  }, [travel]);

  const trailProps = useAnimatedProps(() => ({
    d: waveTrail(travel.value, figureWidth, figureHeight),
  }));

  const yaw = useDerivedValue(() => waveYaw(travel.value));

  const placement = useAnimatedProps(() => {
    const at = wavePoint(travel.value, figureWidth, figureHeight);

    return { transform: `translate(${at.x} ${at.y}) rotate(${waveLean(travel.value)})` };
  });

  const frontProps = useAnimatedProps(() => ({ points: slabAt(yaw.value).front }));
  const flankProps = useAnimatedProps(() => ({ points: slabAt(yaw.value).flank }));
  const roofProps = useAnimatedProps(() => ({ points: slabAt(yaw.value).roof }));
  const screenProps = useAnimatedProps(() => ({ points: slabAt(yaw.value).screen }));

  // The bar sits below everything the figure draws, including the phone at its lowest point
  const barHalfWidth = figureWidth * 0.42;
  const barY = canvasHeight / 2 - size * WAVE.stroke * 3;

  return (
    // A drawn gesture says nothing a screen reader can use, and each platform's reader reads only its own prop
    <View
      testID='qibla-wave-stage'
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
        {/* How much of the wave is done, so the gesture has a visible end rather than running until something
            invisible decides it is finished. A bar UNDER the figure rather than a ring around it: a ring at this
            size cuts through the lobes and reads as part of the drawing */}
        <Path
          d={`M${-barHalfWidth},${barY}L${barHalfWidth},${barY}`}
          fill='none'
          stroke={`rgba(${PALETTE.structure}, 0.18)`}
          strokeWidth={size * WAVE.stroke * 1.4}
          strokeLinecap='round'
        />
        <Path
          testID='qibla-wave-progress'
          d={`M${-barHalfWidth},${barY}L${barHalfWidth},${barY}`}
          fill='none'
          stroke={PALETTE.accent}
          strokeWidth={size * WAVE.stroke * 1.4}
          strokeLinecap='round'
          strokeDasharray={`${barHalfWidth * 2} ${barHalfWidth * 2}`}
          strokeDashoffset={barHalfWidth * 2 * (1 - progress)}
          opacity={0.9}
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
        {/* Drawn back to front, as the Kaaba is: the roof and flank sit behind the face the user reads */}
        <AnimatedGroup animatedProps={placement} testID='qibla-wave-phone'>
          {/* Three tones, because a solid reads as 3D only when its faces differ: the roof catches the most
              light, the front sits between, and the flank is in shade */}
          <AnimatedPolygon animatedProps={roofProps} fill={`rgba(${PALETTE.structure}, 0.42)`} />
          <AnimatedPolygon animatedProps={flankProps} fill={`rgba(${PALETTE.structure}, 0.16)`} />
          <AnimatedPolygon
            animatedProps={frontProps}
            fill={PALETTE.medallion}
            stroke={PALETTE.accent}
            strokeWidth={size * WAVE.stroke}
            strokeLinejoin='round'
          />
          <AnimatedPolygon animatedProps={screenProps} fill={`rgba(${PALETTE.structure}, 0.2)`} />
        </AnimatedGroup>
      </Svg>
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

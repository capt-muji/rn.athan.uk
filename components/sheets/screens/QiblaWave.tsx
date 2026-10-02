import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { COLORS } from '@/shared/constants';
import { phoneBody, phoneScreen, WAVE, waveLean, wavePath, wavePoint } from '@/shared/qiblaWave';

const PALETTE = COLORS.qibla.away;

/** One unhurried pass of the figure: fast enough to read as a motion, slow enough to copy by hand */
const WAVE_DURATION = 3200;

/**
 * The figure of eight the user waves the phone through, drawn as a phone travelling its traced path.
 *
 * A phone rather than a dot, because the instruction is to move THIS OBJECT: a dot teaches a shape where the
 * device teaches the gesture. It leans into each turn off the curve's own tangent, which is what tells the user
 * to roll their wrist rather than slide a flat hand through one plane.
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

  const phoneStyle = useAnimatedStyle(() => {
    const at = wavePoint(progress.value, figureWidth, figureHeight);

    return {
      transform: [{ translateX: at.x }, { translateY: at.y }, { rotate: `${waveLean(progress.value)}deg` }],
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
          stroke={`rgba(${PALETTE.structure}, 0.3)`}
          strokeWidth={size * WAVE.stroke}
          strokeLinecap='round'
          strokeDasharray={`${size * WAVE.stroke * 3} ${size * WAVE.stroke * 3}`}
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
    borderColor: PALETTE.accent,
    justifyContent: 'center',
    position: 'absolute',
  },
  screen: {
    backgroundColor: `rgba(${PALETTE.structure}, 0.28)`,
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

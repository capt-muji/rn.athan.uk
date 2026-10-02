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
import { WAVE, wavePath, wavePoint } from '@/shared/qiblaWave';

const PALETTE = COLORS.qibla.away;

const WAVE_DURATION = 2400;

/**
 * The figure of eight the user waves the phone through, drawn as a dot running its traced path.
 *
 * Shown only while the compass waits for the heading to converge, which is what waving the phone brings about.
 * Mounted for exactly that long, so the loop is never ticking behind the compass (Performance Design Rule 7).
 */
export default function QiblaWave({ size }: { size: number }) {
  const figureWidth = size * WAVE.width;
  const figureHeight = size * WAVE.height;
  const dot = size * WAVE.dot;
  const canvasWidth = figureWidth + dot;
  const canvasHeight = figureHeight + dot;

  const progress = useSharedValue(0);

  useEffect(() => {
    // Starts the motion and never places the dot, which first-frames settled at progress 0 on its own
    progress.value = withRepeat(withTiming(1, { duration: WAVE_DURATION, easing: Easing.linear }), -1);

    // withRepeat(-1) would otherwise keep driving the UI thread once the compass has replaced this
    return () => cancelAnimation(progress);
  }, [progress]);

  const dotStyle = useAnimatedStyle(() => {
    const at = wavePoint(progress.value, figureWidth, figureHeight);

    return { transform: [{ translateX: at.x }, { translateY: at.y }] };
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
          stroke={`rgba(${PALETTE.structure}, 0.38)`}
          strokeWidth={size * WAVE.stroke}
          strokeLinecap='round'
        />
      </Svg>
      {/* A View rather than an animated SVG circle: react-native-svg re-walks its whole drawing pipeline on any
          attribute change, where a transform on a layer is composited */}
      <Animated.View
        testID='qibla-wave-dot'
        style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }, dotStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: PALETTE.accent,
    position: 'absolute',
  },
  stage: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

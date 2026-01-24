import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Defs, ClipPath, Circle, Rect } from 'react-native-svg';

import { useCountdownBar } from '@/hooks/useCountdownBar';
import { ANIMATION, COLORS, RADIUS } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { overlayAtom } from '@/stores/overlay';
import { countdownBarColorAtom } from '@/stores/ui';

const DOT_COUNT = 13;
const DOT_SIZE = 5;
const DOT_GAP = 3;
const PADDING_H = 12;
const PADDING_V = 8;

const CONTENT_WIDTH = DOT_COUNT * DOT_SIZE + (DOT_COUNT - 1) * DOT_GAP;
const TOTAL_WIDTH = CONTENT_WIDTH + PADDING_H * 2;
const TOTAL_HEIGHT = DOT_SIZE + PADDING_V * 2;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  type: ScheduleType;
}

export default function CountdownBar({ type }: Props) {
  const { progress: elapsedProgress, isReady } = useCountdownBar(type);

  const overlay = useAtomValue(overlayAtom);
  const countdownBarColor = useAtomValue(countdownBarColorAtom);

  // Convert elapsed % to remaining %
  const progress = isReady ? 100 - elapsedProgress : 0;

  const progressValue = useSharedValue(progress);
  const colorValue = useSharedValue(0);
  const opacityValue = useSharedValue(overlay.isOn ? 0 : 1);
  const isFirstRender = useRef(true);
  const isFirstOpacityRender = useRef(true);
  const prevProgress = useRef(progress);

  useEffect(() => {
    if (isFirstRender.current) {
      progressValue.value = progress;
      colorValue.value = progress > 10 ? 0 : 1;
      isFirstRender.current = false;
    } else {
      const progressDiff = Math.abs(progress - prevProgress.current);
      const timingConfig = {
        duration: progressDiff > 50 ? 950 : 1000,
        easing: progressDiff > 50 ? Easing.bezier(0.33, 0, 0.1, 1) : Easing.linear,
      };
      progressValue.value = withTiming(progress, timingConfig);

      colorValue.value = withTiming(progress > 10 ? 0 : 1, {
        duration: ANIMATION.durationMedium,
        easing: Easing.linear,
      });
    }
    prevProgress.current = progress;
  }, [progress]);

  useEffect(() => {
    const shouldShow = !overlay.isOn;

    if (isFirstOpacityRender.current) {
      opacityValue.value = shouldShow ? 1 : 0;
      isFirstOpacityRender.current = false;
    } else {
      opacityValue.value = withTiming(shouldShow ? 1 : 0, {
        duration: ANIMATION.duration,
        easing: Easing.linear,
      });
    }
  }, [overlay.isOn]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
  }));

  const barAnimatedProps = useAnimatedProps(() => {
    const barWidth = (progressValue.value / 100) * CONTENT_WIDTH;
    const color = interpolateColor(colorValue.value, [0, 1], [countdownBarColor, COLORS.feedback.warning]);

    return {
      width: barWidth,
      fill: color,
    };
  });

  // Generate circle positions for clip path
  const circles = Array.from({ length: DOT_COUNT }).map((_, index) => {
    const cx = PADDING_H + DOT_SIZE / 2 + index * (DOT_SIZE + DOT_GAP);
    const cy = TOTAL_HEIGHT / 2;
    return { cx, cy, r: DOT_SIZE / 2 };
  });

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <Svg width={TOTAL_WIDTH} height={TOTAL_HEIGHT}>
        <Defs>
          <ClipPath id="dotsClip">
            {circles.map((circle, index) => (
              <Circle key={index} cx={circle.cx} cy={circle.cy} r={circle.r} />
            ))}
          </ClipPath>
        </Defs>

        {/* Inactive dots background */}
        {circles.map((circle, index) => (
          <Circle key={index} cx={circle.cx} cy={circle.cy} r={circle.r} fill="rgba(255,255,255,0.15)" />
        ))}

        {/* Progress bar clipped to circles */}
        <AnimatedRect
          x={PADDING_H}
          y={PADDING_V}
          height={DOT_SIZE}
          clipPath="url(#dotsClip)"
          animatedProps={barAnimatedProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.prayerAgo.gradient.start,
    borderRadius: RADIUS.pill,
  },
});

import { StyleSheet, Dimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { RadialGradient, Stop, Circle } from 'react-native-svg';

import { ANIMATION } from '@/shared/constants';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);

type Props = { isOverlayOn: boolean };

export default function Glow({ isOverlayOn }: Props) {
  const baseOpacity = 0.5;
  const color = '#8000ff';
  const size = Dimensions.get('window').width;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlayOn ? 1 : baseOpacity, { duration: ANIMATION.duration }),
  }));

  return (
    <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={[styles.glow, glowStyle]}>
      <RadialGradient id="radialGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <Stop offset="0%" stopColor={color} stopOpacity={baseOpacity} />
        <Stop offset="50%" stopColor={color} stopOpacity={baseOpacity * 0.5} />
        <Stop offset="75%" stopColor={color} stopOpacity={baseOpacity * 0.25} />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#radialGlow)" />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -Dimensions.get('window').width / 2,
  },
});

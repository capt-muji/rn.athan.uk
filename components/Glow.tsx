import { StyleSheet, ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';
import Svg, { RadialGradient, Stop, Circle } from 'react-native-svg';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { OVERLAY } from '@/shared/constants';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);

interface GlowProps {
  style: ViewStyle;
  color: string;
  baseOpacity?: number;
  size?: number;
}

export default function Glow({ color, style, baseOpacity = 0.5, size }: GlowProps) {
  const window = useWindowDimensions();
  const computedSize = size ?? window.width * 1.5;

  return (
    <AnimatedSvg
      width={computedSize}
      height={computedSize}
      viewBox={`0 0 ${computedSize} ${computedSize}`}
      style={[styles.glow, style]}>
      <RadialGradient id="radialGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <Stop offset="0%" stopColor={color} stopOpacity={baseOpacity * 0.75} />
        <Stop offset="35%" stopColor={color} stopOpacity={baseOpacity * 0.4} />
        <Stop offset="65%" stopColor={color} stopOpacity={baseOpacity * 0.15} />
        <Stop offset="85%" stopColor={color} stopOpacity={baseOpacity * 0.05} />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
      <Circle cx={computedSize / 2} cy={computedSize / 2} r={computedSize / 2} fill="url(#radialGlow)" />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    zIndex: OVERLAY.zindexes.glow,
  },
});

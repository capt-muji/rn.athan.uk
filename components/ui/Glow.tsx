import { StyleSheet, type ViewProps } from 'react-native';
import Reanimated from 'react-native-reanimated';
import Svg, { Circle, RadialGradient, Stop } from 'react-native-svg';

import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { GLOW, OVERLAY, SIZE } from '@/shared/constants';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);

interface GlowProps {
  style: ViewProps['style'];
  color: string;
  baseOpacity?: number;
  size?: number;
}

// Accelerating decay, so the rim sinks into the veil instead of banding grey
const FALLOFF = [
  ['0%', 0.75],
  ['12%', 0.62],
  ['25%', 0.48],
  ['40%', 0.34],
  ['55%', 0.22],
  ['70%', 0.12],
  ['82%', 0.055],
  ['92%', 0.018],
  ['100%', 0],
] as const;

export default function Glow({ color, style, baseOpacity = 0.5, size }: GlowProps) {
  const window = useWindowDimensions();
  const columnWidth = Math.min(window.width, SIZE.contentMaxWidth);
  const computedSize = size ?? columnWidth * GLOW.sizeFactor;

  return (
    <AnimatedSvg
      width={computedSize}
      height={computedSize}
      viewBox={`0 0 ${computedSize} ${computedSize}`}
      style={[styles.glow, style]}>
      <RadialGradient id={'radialGlow'} cx={'50%'} cy={'50%'} r={'50%'} fx={'50%'} fy={'50%'}>
        {FALLOFF.map(([offset, opacity]) => (
          <Stop key={offset} offset={offset} stopColor={color} stopOpacity={baseOpacity * opacity} />
        ))}
      </RadialGradient>
      <Circle cx={computedSize / 2} cy={computedSize / 2} r={computedSize / 2} fill={'url(#radialGlow)'} />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    zIndex: OVERLAY.zindexes.glow,
  },
});

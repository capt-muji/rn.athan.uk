import { StyleSheet, Dimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { RadialGradient, Stop, Circle } from 'react-native-svg';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);

type Props = {
  color?: string;
  baseOpacity?: number;
  isOverlayOn?: boolean;
};

export default function Glow({ color = 'rgb(128,0,255)', baseOpacity = 0.5, isOverlayOn = true }: Props) {
  const size = Dimensions.get('window').width * (isOverlayOn ? 1.2 : 1);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 500 }),
  }));

  return (
    <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={[styles.glow, glowStyle]}>
      <RadialGradient id="radialGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <Stop offset="0%" stopColor={color} stopOpacity={baseOpacity} />
        <Stop offset="25%" stopColor={color} stopOpacity={baseOpacity * 0.67} />
        <Stop offset="50%" stopColor={color} stopOpacity={baseOpacity * 0.33} />
        <Stop offset="75%" stopColor={color} stopOpacity={baseOpacity * 0.17} />
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
    left: -Dimensions.get('window').width / 3,
  },
});

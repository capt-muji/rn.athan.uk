import { StyleSheet, Dimensions } from 'react-native';
import Reanimated from 'react-native-reanimated';
import Svg, { RadialGradient, Stop, Circle } from 'react-native-svg';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);

export default function Glow() {
  const baseOpacity = 0.5;
  const color = 'rgb(128,0,255)';
  const size = Dimensions.get('window').width * 1.5;

  return (
    <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={[styles.glow]}>
      <RadialGradient id="radialGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <Stop offset="0%" stopColor={color} stopOpacity={baseOpacity * 0.5} />
        <Stop offset="35%" stopColor={color} stopOpacity={baseOpacity * 0.4} />
        <Stop offset="65%" stopColor={color} stopOpacity={baseOpacity * 0.15} />
        <Stop offset="85%" stopColor={color} stopOpacity={baseOpacity * 0.05} />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#radialGlow)" />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -Dimensions.get('window').width / 1.25,
    left: -Dimensions.get('window').width / 2,
    pointerEvents: 'none',
  },
});

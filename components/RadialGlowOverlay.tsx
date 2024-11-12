import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAtom } from 'jotai';
import { overlayVisibleToggleAtom } from '@/store/store';
import { OVERLAY } from '@/constants';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);
const GRADIENT_ID = 'radialGlow';

export default function RadialGlow() {
  const size = Dimensions.get('window').width;

  const [overlayVisible] = useAtom(overlayVisibleToggleAtom);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(overlayVisible ? 1 : 0, { duration: 300 })
  }));

  return (
    <AnimatedSvg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={[styles.glow, glowStyle]}>
      <Defs>
        <RadialGradient id={GRADIENT_ID} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="rgb(255,100,100)" stopOpacity="0.5" />
          <Stop offset="15%" stopColor="rgb(255,100,100)" stopOpacity="0.4" />
          <Stop offset="25%" stopColor="rgb(255,100,100)" stopOpacity="0.3" />
          <Stop offset="35%" stopColor="rgb(255,100,100)" stopOpacity="0.2" />
          <Stop offset="50%" stopColor="rgb(255,100,100)" stopOpacity="0.1" />
          <Stop offset="65%" stopColor="rgb(255,100,100)" stopOpacity="0.07" />
          <Stop offset="75%" stopColor="rgb(255,100,100)" stopOpacity="0.05" />
          <Stop offset="85%" stopColor="rgb(255,100,100)" stopOpacity="0.02" />
          <Stop offset="100%" stopColor="rgb(255,100,100)" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${GRADIENT_ID})`} />
    </AnimatedSvg>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -Dimensions.get('window').width / 2,
    zIndex: OVERLAY.zindexes.on.glow2,
  }
});
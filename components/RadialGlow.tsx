import { ViewProps } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Reanimated from 'react-native-reanimated';

interface Props extends ViewProps {
  size: number;
}

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);
const GRADIENT_ID = 'radialGlow'; // unique ID

export default function RadialGlow({ size, style }: Props) {
  return (
    <AnimatedSvg
      width="100%"
      height="100%"
      viewBox={`0 0 ${size} ${size}`}
      style={[{ overflow: 'visible', opacity: 1 }, style]}
    >
      <Defs>
        <RadialGradient id={GRADIENT_ID} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="rgb(128,0,255)" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="rgb(0,0,0)" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={`url(#${GRADIENT_ID})`}
      />
    </AnimatedSvg>
  );
}
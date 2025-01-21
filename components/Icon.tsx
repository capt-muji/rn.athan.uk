import { memo } from 'react';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import ICON_PATHS from '@/assets/icons/icons';
import { AlertIcon } from '@/shared/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  type: AlertIcon;
  size: number;
  color?: string;
  animatedProps?: any; // Using any here as the adapter changes the type structure
}

function Icon({ type, size, color, animatedProps }: Props) {
  const pathData = ICON_PATHS[type];

  return (
    <Svg viewBox="0 0 256 256" height={size} width={size}>
      {animatedProps ? <AnimatedPath d={pathData} animatedProps={animatedProps} /> : <Path d={pathData} fill={color} />}
    </Svg>
  );
}

export default memo(Icon);

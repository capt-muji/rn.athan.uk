
import { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AlertIcon } from '@/shared/types';
import ICON_PATHS from '@/assets/icons/icons';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  type: AlertIcon;
  size: number;
  color?: string;
  animatedProps?: any;
}

export default class Icon extends PureComponent<Props> {
  render() {
    const { type, size, color, animatedProps } = this.props;
    const pathData = ICON_PATHS[type];

    return (
      <Svg viewBox="0 0 256 256" height={size} width={size}>
        {animatedProps ? (
          <AnimatedPath d={pathData} animatedProps={animatedProps} />
        ) : (
          <Path d={pathData} fill={color} />
        )}
      </Svg>
    );
  }
}
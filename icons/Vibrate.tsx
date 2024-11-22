import { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  color: string;
  size: number;
  animatedProps: any;
}

export default class Vibrate extends PureComponent<Props> {
  render() {
    return (
      <Svg viewBox="0 0 256 256" height={this.props.size} width={this.props.size}>
        <AnimatedPath
          animatedProps={this.props.animatedProps}
          fill={this.props.color}
          d="M160,32H96A24,24,0,0,0,72,56V200a24,24,0,0,0,24,24h64a24,24,0,0,0,24-24V56A24,24,0,0,0,160,32Zm8,168a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8h64a8,8,0,0,1,8,8ZM216,88v80a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Zm32,16v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0ZM56,88v80a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0ZM24,104v48a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"
        />
      </Svg>
    );
  }
}

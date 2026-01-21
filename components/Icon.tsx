import { memo } from 'react';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import ICON_PATHS from '@/assets/icons/icons';
import { AlertIcon } from '@/shared/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Props for the Icon component
 */
interface Props {
  /** The type of icon to render */
  type: AlertIcon;
  /** Size of the icon in pixels */
  size: number;
  /** Fill color for the icon (optional, defaults to white) */
  color?: string;
  /** Animated properties for Reanimated animations (optional) */
  animatedProps?: {
    /** SVG path data (optional - set separately on AnimatedPath) */
    d?: string;
    /** Fill color for animated path (optional) */
    fill?: string;
    [key: string]: unknown;
  };
}

/**
 * Renders an SVG icon with optional Reanimated animations
 * Uses predefined icon paths from ICON_PATHS
 */
function Icon({ type, size, color, animatedProps }: Props) {
  const pathData = ICON_PATHS[type];

  return (
    <Svg viewBox="0 0 256 256" height={size} width={size}>
      {animatedProps ? <AnimatedPath d={pathData} animatedProps={animatedProps} /> : <Path d={pathData} fill={color} />}
    </Svg>
  );
}

export default memo(Icon);

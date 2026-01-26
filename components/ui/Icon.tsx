import { memo } from 'react';
import { TextStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import ICONS from '@/assets/icons/svg';
import { Icon as IconType } from '@/shared/types';

/**
 * Props for the Icon component
 */
interface Props {
  /** The type of icon to render */
  type: IconType;
  /** Size of the icon in pixels */
  size: number;
  /** Fill color for the icon (optional, defaults to white) */
  color?: string;
  /** Animated style for Reanimated animations (optional) */
  animatedStyle?: AnimatedStyle<TextStyle>;
}

/**
 * Renders an SVG icon with optional Reanimated animations
 * Uses SVG components from ICONS
 */
function Icon({ type, size, color, animatedStyle }: Props) {
  const IconComponent = ICONS[type];

  if (animatedStyle) {
    const AnimatedIcon = Animated.createAnimatedComponent(IconComponent);
    return <AnimatedIcon width={size} height={size} style={animatedStyle} />;
  }

  return <IconComponent width={size} height={size} style={{ color }} />;
}

export default memo(Icon);

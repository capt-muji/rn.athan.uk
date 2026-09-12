import { memo } from 'react';
import type { TextStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import ICONS from '@/assets/icons/svg';
import type { Icon as IconType } from '@/shared/types';

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

const createAnimatedIcon = (type: IconType) => Animated.createAnimatedComponent(ICONS[type]);

/**
 * createAnimatedComponent returns a brand new component type on every call, and
 * React identifies a subtree by its type: building one during render hands React
 * a different type each pass, so it unmounts the icon and mounts a fresh one
 * every render — which throws away exactly the animation state the caller passed
 * animatedStyle to drive. Cached per icon type so each is built once for the
 * lifetime of the app, and lazily so the non-animated path (every caller today)
 * builds nothing at all.
 */
const animatedIcons = new Map<IconType, ReturnType<typeof createAnimatedIcon>>();

const getAnimatedIcon = (type: IconType) => {
  const cached = animatedIcons.get(type);
  if (cached) return cached;

  const created = createAnimatedIcon(type);
  animatedIcons.set(type, created);
  return created;
};

/**
 * Renders an SVG icon with optional Reanimated animations
 * Uses SVG components from ICONS
 */
function Icon({ type, size, color, animatedStyle }: Props) {
  const IconComponent = ICONS[type];

  if (animatedStyle) {
    const AnimatedIcon = getAnimatedIcon(type);
    return <AnimatedIcon width={size} height={size} style={animatedStyle} />;
  }

  return <IconComponent width={size} height={size} style={{ color }} />;
}

export default memo(Icon);

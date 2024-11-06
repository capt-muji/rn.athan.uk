import { Easing } from 'react-native-reanimated';

export const ANIMATION = {
  duration: 300,
  config: {
    duration: 300,
    easing: Easing.bezier(0.33, 0.01, 0, 1),
  }
} as const;

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';
import { DESIGN } from '@/shared/design';

/**
 * The screen's background gradient, which has no behaviour of its own beyond
 * filling the screen. The prototype's optional bottom tail (T-374 round 7)
 * holds a colour inside the last tenth of the diagonal; without it the ramp is
 * the original two-stop.
 */
export default function BackgroundGradients() {
  const tail = DESIGN.bgTail;
  // the tail eases in over the lower journey in two stages; a single stop at
  // the end reads as a sharp corner blob (round 7 verdict)
  const blend = (a: string, b: string) => {
    const x = parseChannels(a);
    const y = parseChannels(b);
    return `#${x
      .map((v, n) =>
        Math.round((v + y[n]) / 2)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  };
  return (
    <LinearGradient
      colors={
        tail === null
          ? [COLORS.gradient.screen.start, COLORS.gradient.screen.end]
          : [COLORS.gradient.screen.start, COLORS.gradient.screen.end, blend(COLORS.gradient.screen.end, tail), tail]
      }
      locations={tail === null ? [0, 1] : [0, 0.7, 0.87, 1]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0.25 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

const parseChannels = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';
import { tailFor } from '@/shared/design';

/** The screen's background gradient, which has no behaviour of its own beyond
 * filling the screen. iOS eases the tail in through a two-stage ramp (a single
 * stop at the end reads as a sharp corner blob); Android, where that eased
 * body band read as its own colour on the panel, runs navy straight to the
 * tail instead. */
export default function BackgroundGradients() {
  const android = Platform.OS === 'android';
  const tail = tailFor(Platform.OS);
  return (
    <LinearGradient
      colors={
        android
          ? [COLORS.gradient.screen.start, tail]
          : [COLORS.gradient.screen.start, COLORS.gradient.screen.end, blend(COLORS.gradient.screen.end, tail), tail]
      }
      locations={android ? [0, 1] : [0, 0.7, 0.87, 1]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

const parseChannels = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

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

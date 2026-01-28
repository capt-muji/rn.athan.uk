import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';

export default function BackgroundGradients() {
  return (
    <LinearGradient
      colors={[COLORS.gradient.screen.start, COLORS.gradient.screen.end]}
      locations={[0, 1]}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: 0.25 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

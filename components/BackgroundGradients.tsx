import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { COLORS } from '@/shared/constants';

export default function BackgroundGradients() {
  return (
    <LinearGradient
      colors={[COLORS.gradientScreen1Start, COLORS.gradientScreen1End]}
      locations={[0, 1]}
      style={StyleSheet.absoluteFillObject}
      start={{ x: 0, y: 0.25 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

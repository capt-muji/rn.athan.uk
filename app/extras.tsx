import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, OVERLAY } from '@/constants';
import Extras from '@/components/Error';
import { useEffect } from 'react';

export default function ExtrasScreen() {
  return (
    <View style={styles.container}>
      <Extras />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: OVERLAY.zindexes.background
  },
});
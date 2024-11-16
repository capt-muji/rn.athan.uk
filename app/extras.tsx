import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, OVERLAY } from '@/constants';
import Extras from '@/components/Error';
import { useEffect } from 'react';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { runOnJS } from 'react-native-reanimated';

export default function ExtrasScreen() {
  const swipeGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      'worklet';
      runOnJS(router.back)();
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        <Extras />
      </View>
    </GestureDetector>
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
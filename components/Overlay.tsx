import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { overlayAtom } from '@/store/store';

export default function Overlay() {
  const [isOverlay, setIsOverlay] = useAtom(overlayAtom);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlay ? 0.95 : 0, { duration: 200 }),
    backgroundColor: 'black',
    zIndex: isOverlay ? 1 : -1,
  }));

  return (
    <Pressable onPress={() => setIsOverlay(false)}>
      <Animated.View style={[styles.overlay, animatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSh// eet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

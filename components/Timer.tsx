import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom } from '../store';

interface TimerAnimation {
  scale: Animated.AnimatedInterpolation;
  translateY: Animated.AnimatedInterpolation;
}

export default function Timer() {
  const [timerName, setTimerName] = useState('Dhuhr');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);

  // Memoize animation values to prevent recalculation
  const animations: TimerAnimation = useMemo(() => ({
    scale: overlayAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5]
    }),
    translateY: overlayAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10]
    })
  }), [overlayAnimation]);

  // Update timer name when overlay visibility changes
  useEffect(() => {
    setTimerName(overlayVisible > -1
      ? todaysPrayers[overlayVisible].english
      : 'Dhuhr'
    );
  }, [overlayVisible, todaysPrayers]);

  return (
    <View style={[styles.container, overlayVisible > -1 && styles.visible]}>
      <Text style={styles.text}>{timerName} in</Text>
      <Animated.Text
        style={[
          styles.timer,
          {
            transform: [
              { scale: animations.scale },
              { translateY: animations.translateY }
            ]
          }
        ]}
      >
        3h 44m 13s
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SCREEN.paddingHorizontal
  },
  text: {
    color: COLORS.textPrimary,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 5,
    fontSize: TEXT.size - 2,
  },
  timer: {
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    marginBottom: 45,
  },
  visible: {
    zIndex: 1
  }
});

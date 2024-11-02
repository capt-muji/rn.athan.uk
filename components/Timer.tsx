import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom } from '../store';

export default function Timer() {
  const [timerName, setTimerName] = useState('Dhuhr');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);

  const scaleInterpolation = overlayAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });

  const translateYInterpolation = overlayAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10]
  });

  useEffect(() => {
    if (overlayVisible > -1) {
      setTimerName(todaysPrayers[overlayVisible].english);
    } else {
      setTimerName('Dhuhr');
    }
  }, [overlayVisible]);

  return (
    <View style={[styles.container, { zIndex: overlayVisible > -1 && 1 }]}>
      <Text style={styles.text}>{timerName} in</Text>
      <Animated.Text
        style={[
          styles.timer,
          {
            transform: [
              { scale: scaleInterpolation },
              { translateY: translateYInterpolation }
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
});

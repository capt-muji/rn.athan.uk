import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom } from '../store';
import { getTimeDifference, formatTimeRemaining } from '../utils/time';

interface TimerAnimation {
  scale: Animated.AnimatedInterpolation;
  translateY: Animated.AnimatedInterpolation;
}

export default function Timer() {
  const [timerName, setTimerName] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('...');
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let animationFrameId: number;

    const updateTimer = (prayer: ITransformedPrayer) => {
      const update = () => {
        const diff = getTimeDifference(prayer.time);
        setTimeRemaining(formatTimeRemaining(diff));
        
        // Schedule next update aligned with the next second
        const now = Date.now();
        const delay = 1000 - (now % 1000);
        intervalId = setTimeout(() => {
          animationFrameId = requestAnimationFrame(update);
        }, delay);
      };

      update();
    };

    if (overlayVisible > -1) {
      const prayer = todaysPrayers[overlayVisible];
      setTimerName(prayer.english);
      updateTimer(prayer);
    } else {
      const nextPrayer = Object.values(todaysPrayers).find(prayer => prayer.isNext);
      if (nextPrayer) {
        setTimerName(nextPrayer.english);
        updateTimer(nextPrayer);
      }
    }

    return () => {
      clearTimeout(intervalId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
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
        {timeRemaining}
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

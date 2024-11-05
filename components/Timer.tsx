import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom, nextPrayerIndexAtom } from '@/store/store';
import { handleTimerUpdate } from '@/controllers/time';

export default function Timer() {
  const [timerName, setTimerName] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  useEffect(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) return;

    const updateTimer = () => {
      handleTimerUpdate(
        todaysPrayers,
        overlayVisible,
        nextPrayerIndex,
        setTimerName,
        setTimeDisplay,
        setNextPrayerIndex
      );
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, overlayVisible, todaysPrayers]);

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}>
          {timerName}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            {`${timerName || '...'} in`}
          </Text>
          {timeDisplay && (
            <Animated.Text
              style={[
                styles.timer,
                {
                  transform: [
                    {
                      scale: overlayAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5]
                      })
                    },
                    {
                      translateY: overlayAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [5, 10]
                      })
                    }
                  ]
                }
              ]}
            >
              {timeDisplay}
            </Animated.Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50, // Fixed height that accommodates both states
    marginTop: SCREEN.paddingHorizontal,
    marginBottom: 35,
    zIndex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    opacity: 0.5,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
  },
  timer: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 5,
    textAlign: 'center',
  }
});

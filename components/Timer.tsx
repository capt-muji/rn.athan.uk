import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';
import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom, nextPrayerIndexAtom } from '../store';
import { getTimeDifference } from '../utils/time';

interface TimerAnimation {
  scale: Animated.AnimatedInterpolation;
  translateY: Animated.AnimatedInterpolation;
}

export default function Timer() {
  const [timerName, setTimerName] = useState('');
  const [timeDisplay, setTimeDisplay] = useState('');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);
  const [nextPrayerIndex, setNextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  useEffect(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) return;

    const formatTime = (ms: number) => {
      if (ms <= 0) return '0s';
      
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

      return parts.join(' ');
    };

    const updateTimer = () => {
      console.log('⏰ Timer Update:', new Date().toLocaleTimeString());

      const currentPrayer = overlayVisible > -1
        ? todaysPrayers[overlayVisible]
        : todaysPrayers[nextPrayerIndex];

      if (!currentPrayer) {
        console.log('⚠️ No current prayer found');
        setTimerName('All prayers passed');
        setTimeDisplay('');
        return;
      }

      console.log('📍 Current Prayer:', {
        name: currentPrayer.english,
        time: currentPrayer.time,
        index: nextPrayerIndex
      });

      const diff = getTimeDifference(currentPrayer.time);
      console.log('⌛ Time difference:', diff, 'ms');

      setTimerName(currentPrayer.english);
      setTimeDisplay(formatTime(diff));

      if (diff <= 0) {
        console.log('✨ Prayer time reached!');
        console.log('Prayer:', currentPrayer.english);
        console.log('Index:', nextPrayerIndex);
        
        // Mark current prayer as passed
        if (todaysPrayers[nextPrayerIndex]) {
          todaysPrayers[nextPrayerIndex].passed = true;
        }

        // If it's Isha (last prayer, index 6)
        if (nextPrayerIndex === 6) {
          console.log('🌙 Last prayer (Isha) completed');
          setNextPrayerIndex(-1); // All prayers done for the day
        } else {
          console.log('⏭️ Moving to next prayer');
          setNextPrayerIndex(prev => {
            console.log('Updating index from', prev, 'to', prev + 1);
            return prev + 1;
          });
        }
      }
    };

    console.log('🔄 Setting up timer interval');
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [nextPrayerIndex, overlayVisible, todaysPrayers]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {nextPrayerIndex === -1 ? timerName : `${timerName || '...'} in`}
      </Text>
      {nextPrayerIndex !== -1 && timeDisplay && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SCREEN.paddingHorizontal,
    marginBottom: 35,
    zIndex: 1,
    elevation: 2, // is this needed?
    position: 'relative', // is this needed?
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

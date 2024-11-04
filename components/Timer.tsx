import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Animated, AppState } from 'react-native';
import { useAtom } from 'jotai';
import * as Notifications from 'expo-notifications';
import { storage } from '../storage/mmkv';

import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom, overlayAnimationAtom } from '../store';
import { getTimeDifference, formatTimeRemaining } from '../utils/time';

// 1. Configure notification handler for how notifications should appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_STATE_KEY = 'notification_state';

interface TimerAnimation {
  scale: Animated.AnimatedInterpolation;
  translateY: Animated.AnimatedInterpolation;
}

export default function Timer() {
  // 2. Initialize states:
  // - Timer display states
  const [timerName, setTimerName] = useState('');         // Name of prayer being counted down to
  const [timeRemaining, setTimeRemaining] = useState(''); // Time remaining display

  // - System states
  const [appState, setAppState] = useState(AppState.currentState); // For detecting if app is active/background
  const [notificationState, setNotificationState] = useState('off'); // Notification settings (off/notification/vibrate/sound)

  // - Global states from Jotai
  const [todaysPrayers] = useAtom(todaysPrayersAtom);     // All prayers for today
  const [overlayVisible] = useAtom(overlayVisibleAtom);   // Which prayer is selected (-1 means none)
  const [overlayAnimation] = useAtom(overlayAnimationAtom); // Animation values for overlay

  // Create separate animation value for timer
  const timerAnimation = useMemo(() => new Animated.Value(1), []);

  // 3. On component mount:
  // - Load saved notification preferences
  useEffect(() => {
    const state = storage.storage.getString(NOTIFICATION_STATE_KEY);
    if (state) setNotificationState(state);
  }, []);

  // Memoize finding the current prayer to display
  const currentPrayer = useMemo(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) {
      return null;
    }

    return overlayVisible > -1
      ? todaysPrayers[overlayVisible]
      : Object.values(todaysPrayers).find(p => p.isNext);
  }, [overlayVisible, todaysPrayers]);

  // Memoize checking if all prayers have passed
  const allPrayersPassed = useMemo(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) {
      return false;
    }
    return Object.values(todaysPrayers).every(prayer => prayer.passed);
  }, [todaysPrayers]);

  // 5. Handle prayer transitions (when one prayer time is reached)
  const handlePrayerTransition = async (nextPrayer) => {
    if (!nextPrayer) return;

    // Clear existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule notification for next prayer if notifications are enabled
    if (notificationState !== 'off') {
      await scheduleNotification(nextPrayer, notificationState);
    }
  };

  // 6. Handle scheduling next day's Fajr prayer
  const scheduleNextDayFajr = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPrayers = storage.getPrayersByDate(tomorrow.toISOString().split('T')[0]);

    if (tomorrowPrayers && notificationState !== 'off') {
      await scheduleNotification(tomorrowPrayers.fajr, notificationState);
    }
  };

  // 7. Set up app state listener (active/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    Notifications.requestPermissionsAsync();

    return () => {
      subscription.remove();
    };
  }, []);

  // Modified findNextPrayer function with null checks
  const findNextPrayer = useCallback((prayers, currentPrayer) => {
    if (!prayers || !currentPrayer) return null;

    const orderedPrayers = ['fajr', 'sunrise', 'duha', 'dhuhr', 'asr', 'magrib', 'isha'];
    const currentIndex = orderedPrayers.indexOf(currentPrayer.english.toLowerCase());

    if (currentIndex === -1 || currentIndex === orderedPrayers.length - 1) return null;

    const nextPrayerName = orderedPrayers[currentIndex + 1];
    return Object.values(prayers).find(p =>
      p.english.toLowerCase() === nextPrayerName
    );
  }, []);

  // Modify the main timer effect
  useEffect(() => {
    if (allPrayersPassed) {
      setTimerName('All prayers passed');
      setTimeRemaining('');
      scheduleNextDayFajr();
      return;
    }

    if (!currentPrayer) {
      setTimerName('Loading...');
      setTimeRemaining('');
      return;
    }

    let intervalId: NodeJS.Timeout;

    const updateTimer = () => {
      const diff = getTimeDifference(currentPrayer.time);

      if (diff <= 0) {
        handlePrayerTransition(findNextPrayer(todaysPrayers, currentPrayer));
        clearTimeout(intervalId);
        return;
      }

      setTimerName(currentPrayer.english);
      setTimeRemaining(formatTimeRemaining(diff));

      const now = Date.now();
      const delay = 1000 - (now % 1000);
      intervalId = setTimeout(updateTimer, delay);
    };

    updateTimer();

    return () => {
      clearTimeout(intervalId);
    };
  }, [currentPrayer, allPrayersPassed, todaysPrayers]);

  // 9. Notification scheduling helper
  const scheduleNotification = async (prayer, notificationState) => {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);

    if (prayerTime.getTime() <= Date.now()) return;

    const notification = {
      content: {
        title: 'Prayer Time',
        body: `It's time for ${prayer.english}`,
      },
      trigger: {
        date: prayerTime,
      },
    };

    // Configure notification based on state
    switch (notificationState) {
      case 'notification':
        notification.content.sound = null;
        break;
      case 'vibrate':
        notification.content.sound = null;
        // Add vibration pattern
        break;
      case 'sound':
        notification.content.sound = 'default';
        break;
    }

    await Notifications.scheduleNotificationAsync(notification);
  };

  // 11. Render timer display
  return (
    <View style={[styles.container]}>
      <Text style={[styles.text]}>
        {allPrayersPassed ? timerName : `${timerName || '...'} in`}
      </Text>
      {!allPrayersPassed && timeRemaining && (
        <Animated.Text
          style={[
            styles.timer,
            {
              opacity: 1,
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
          {timeRemaining}
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

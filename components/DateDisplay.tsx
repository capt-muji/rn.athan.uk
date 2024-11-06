import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ANIMATION } from '@/constants/animations';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { selectedPrayerDateAtom, overlayAtom, overlayDateColorAtom } from '@/store/store';
import Masjid from './Masjid';

export default function DateDisplay() {
  const [selectedDate] = useAtom(selectedPrayerDateAtom);
  const [isOverlay] = useAtom(overlayAtom);
  const [overlayDateColor] = useAtom(overlayDateColorAtom);

  const today = new Date();
  const date = selectedDate === 'tomorrow' ? new Date(today.setDate(today.getDate() + 1)) : today;

  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlay ? 0 : 1, { duration: ANIMATION.duration }),
  }));

  const locationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlay ? 0 : TEXT.opacity, { duration: ANIMATION.duration }),
  }));

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOverlay ? TEXT.opacity : 1, { duration: ANIMATION.duration }),
    color: withTiming(overlayDateColor, { duration: ANIMATION.duration }),
  }));

  return (
    <View style={styles.container}>
      <View>
        <Animated.Text style={[styles.location, locationAnimatedStyle]}>London, UK</Animated.Text>
        <Animated.Text style={[styles.date, dateAnimatedStyle]}>{formattedDate}</Animated.Text>
      </View>
      <Animated.View style={animatedStyle}>
        <Masjid />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN.paddingHorizontal,
    zIndex: 1,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size - 2,
    fontFamily: TEXT.famiy.regular,
    marginBottom: 5,
  },
  date: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});

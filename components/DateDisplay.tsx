import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { selectedPrayerDateAtom, overlayAnimationAtom } from '@/store/store';
import Masjid from './Masjid';

export default function DateDisplay() {
  const [selectedDate] = useAtom(selectedPrayerDateAtom);
  const [overlayAnimation] = useAtom(overlayAnimationAtom);

  const today = new Date();
  const date = selectedDate === 'tomorrow' ? new Date(today.setDate(today.getDate() + 1)) : today;

  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <View style={[styles.container]}>
      <View>
        <Animated.Text style={[
          styles.location,
          {
            opacity: overlayAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0]
            })
          }
        ]}>
          London, UK
        </Animated.Text>
        <Animated.Text style={[
          styles.date,
          {
            opacity: overlayAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.5]
            })
          }
        ]}>
          {formattedDate}
        </Animated.Text>
      </View>
      <Animated.View style={{
        opacity: overlayAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0]
        })
      }}>
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
    opacity: 0.5,
    color: COLORS.textPrimary,
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

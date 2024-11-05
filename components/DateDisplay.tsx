import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { overlayVisibleAtom, selectedPrayerDateAtom } from '@/store/store';
import Masjid from './Masjid';

export default function DateDisplay() {
  const [selectedDate] = useAtom(selectedPrayerDateAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);

  const today = new Date();
  const date = selectedDate === 'tomorrow' ? new Date(today.setDate(today.getDate() + 1)) : today;
  
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <View style={[
      styles.container,
      overlayVisible > -1 && styles.overlayVisible
    ]}>
      <View>
        <Text style={[styles.location]}>London, UK</Text>
        <Text style={[styles.date]}>{formattedDate}</Text>
      </View>
      <Masjid />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN.paddingHorizontal
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
  overlayVisible: {
    zIndex: 2,
  }
});

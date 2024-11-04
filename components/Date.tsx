import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SCREEN, TEXT } from '@/constants';
import Masjid from './Masjid';

export default function Date() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.location]}>London, UK</Text>
        <Text style={[styles.date]}>Mon, 28 Oct 2024</Text>
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
  }
});

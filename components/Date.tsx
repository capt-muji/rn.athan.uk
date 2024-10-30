import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, TEXT } from '../constants';
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
    marginBottom: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  location: {
    opacity: 0.5,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
    marginBottom: 5,
  },
  date: {
    color: COLORS.textPrimary,
    fontSize: 18,
  }
});

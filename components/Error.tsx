import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BsArrowClockwise } from "rn-icons/bs";
import { initializePrayers } from '../controllers/prayer';
import { prayerStateAtom } from '@/store/store';
import { useAtom } from 'jotai';

import { COLORS, TEXT } from '../constants';
import Masjid from './Masjid';

export default function Date() {
  const [prayerState, setPrayerState] = useAtom(prayerStateAtom);

  const handleRefresh = () => {
    initializePrayers(
      (loading) => setPrayerState(prev => ({ ...prev, isLoading: loading })),
      (error) => setPrayerState(prev => ({ ...prev, hasError: error })),
      (prayers) => setPrayerState(prev => ({ ...prev, todaysPrayers: prayers })),
      (index) => setPrayerState(prev => ({ ...prev, nextPrayerIndex: index }))
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading]}> Oh no! </Text>
      <Text style={[styles.subtext, styles.first]}> Something went wrong. </Text>
      <Text style={[styles.subtext, styles.last]}> We are investigating! </Text>
      <Masjid height={65} width={60} />
      <Pressable onPress={handleRefresh} style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 1 : 0.75 },
      ]}>
        <BsArrowClockwise style={styles.icon} size={16} color={'white'} />
        <Text style={[styles.subtext]}> Refresh </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 18
  },
  subtext: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
  first: {
    marginBottom: 4
  },
  last: {
    marginBottom: 50
  },
  button: {
    marginTop: 50,
    flexDirection: 'row',
    backgroundColor: COLORS.transparentBlack,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 5,
  },
  icon: {
    marginRight: 10
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '../constants';
import { overlayVisibleAtom, todaysPrayersAtom } from '../store';

export default function Timer() {
  const [timerName, setTimerName] = useState('Dhuhr');
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);

  useEffect(() => {
    if (overlayVisible > -1) {
      setTimerName(todaysPrayers[overlayVisible].english);
    } else {
      setTimerName('Dhuhr');
    }
  }, [overlayVisible]);

  return (
    <View style={[styles.container, { zIndex: overlayVisible > -1 && 1 }]}>
      <Text style={styles.text}>{timerName} in</Text>
      <Text style={styles.timer}>3h 44m 13s</Text>
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
});

import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import { todaysPrayersAtom } from '../store';
import { COLORS } from '../constants';
import { storage } from '../storage/mmkv';

const NOTIFICATION_STATE_KEY = 'notification_state';

export default function DebugOverlay() {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);

  const { current, next, alertState } = useMemo(() => {
    const state = storage.storage.getString(NOTIFICATION_STATE_KEY) || 'off';
    
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) {
      return { current: null, next: null, alertState: state };
    }

    const currentPrayer = Object.values(todaysPrayers).find(p => p.isNext);
    const nextPrayer = currentPrayer ? 
      Object.values(todaysPrayers).find(p => p.index > currentPrayer.index && !p.passed) 
      : null;

    return { current: currentPrayer, next: nextPrayer, alertState: state };
  }, [todaysPrayers]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Info:</Text>
      <View style={styles.section}>
        <Text style={styles.text}>Current Prayer:</Text>
        <Text style={styles.value}>
          {current ? 
            `${current.english} (index: ${current.index}) - Alert: ${alertState}` : 
            'None'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Next Prayer:</Text>
        <Text style={styles.value}>
          {next ? 
            `${next.english} (index: ${next.index}) - Alert: ${alertState}` : 
            'None'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,  // Changed from 'top: 50' to 'bottom: 20'
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 100,
  },
  title: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginBottom: 5,
  },
  text: {
    color: COLORS.textPrimary,
    opacity: 0.8,
  },
  value: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  }
});

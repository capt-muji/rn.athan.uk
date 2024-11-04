import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import { todaysPrayersAtom } from '../store';
import { COLORS } from '../constants';

export default function DebugOverlay() {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);

  const { current, next } = useMemo(() => {
    if (!todaysPrayers || Object.keys(todaysPrayers).length === 0) {
      return { current: null, next: null };
    }

    const currentPrayer = Object.values(todaysPrayers).find(p => p.isNext);
    const nextPrayer = currentPrayer ?
      Object.values(todaysPrayers).find(p => p.index > currentPrayer.index && !p.passed)
      : null;

    return { current: currentPrayer, next: nextPrayer };
  }, [todaysPrayers]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Info:</Text>
      <View style={styles.section}>
        <Text style={styles.text}>Current Prayer:</Text>
        <Text style={styles.value}>
          {current ?
            `${current.english} (index: ${current.index})` :
            'None'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Next Prayer:</Text>
        <Text style={styles.value}>
          {next ?
            `${next.english} (index: ${next.index})` :
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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

export default function Timer() {
  return (
    <View>
      <Text style={styles.text}>Dhuhr in</Text>
      <Text style={styles.timer}>3h 19m 12s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.textPrimary,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 5,
  },
  timer: {
    color: COLORS.textPrimary,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
});

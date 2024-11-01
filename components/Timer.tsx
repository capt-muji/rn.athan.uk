import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TEXT } from '../constants';

export default function Timer() {
  return (
    <View>
      <Text style={styles.text}>Dhuhr in</Text>
      <Text style={styles.timer}>99h 99m 99s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: COLORS.textPrimary,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 5,
    fontSize: TEXT.size - 2,
  },
  timer: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 8,
    textAlign: 'center',
    marginBottom: 45,
  },
});

import React from 'react';
import { StyleSheet, Pressable, Text} from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";

import { COLORS } from '../constants';

export default function Prayer() {
  return (
    <Pressable style={[styles.container, styles.next]}>
      <Text style={[styles.text, styles.english]}>Fajr</Text>
      <Text style={[styles.text, styles.arabic]}>الفجر</Text>
      <Text style={[styles.text, styles.time]}>05:09</Text>
      <PiBellSimpleSlash color={'white'} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 15,
    opacity: 0.5,
    paddingHorizontal: 20,
    paddingLeft: 15
  },
  passed: {
    opacity: 1,
  },
  next: {
    opacity: 1,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    borderRadius: 5,
  },
  text: {
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
  time: {
    flex: 2,
    textAlign: 'center',
  },
});

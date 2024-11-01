import React, { useState } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { useAtom } from 'jotai';
import { todaysPrayersAtom } from '@/store';
import Tooltip from 'react-native-walkthrough-tooltip';
import Timer from './Timer';

import { COLORS, TEXT } from '../constants';

interface Props { index: number }

export default function Prayer({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const prayer = todaysPrayers[index];

  const [toolTipVisible, setToolTipVisible] = useState(false);

  return (
    // @ts-ignore
    <Tooltip
      isVisible={toolTipVisible}
      content={<Timer />}
      onClose={() => setToolTipVisible(false)}
      backgroundColor={'black'}
      contentStyle={styles.contentStyle}
    >
      <Pressable
        style={[styles.container, styles.passed]}
        onPress={() => setToolTipVisible((prev) => !prev)}
      >
        <Text style={[styles.text, styles.english]}>{prayer.english}</Text>
        <Text style={[styles.text, styles.arabic]}>{prayer.arabic}</Text>
        <Text style={[styles.text, styles.time]}>{prayer.time}</Text>
        <PiBellSimpleSlash color={'white'} size={20} />
      </Pressable>
    </Tooltip >
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
    fontSize: TEXT.size,
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
  contentStyle: {
    paddingHorizontal: 35,
    paddingVertical: 20,
    backgroundColor: 'black'
  },
});

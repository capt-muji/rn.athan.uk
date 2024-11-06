import React, { useCallback } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { useAtom } from 'jotai';

import { todaysPrayersAtom, nextPrayerIndexAtom, tomorrowsPrayersAtom, selectedPrayerDateAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN } from '@/constants';
import Alert from './Alert';

interface Props {
  index: number;
}

export default function Prayer({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [tomorrowsPrayers] = useAtom(tomorrowsPrayersAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedPrayerDateAtom);

  const toggleDate = useCallback(() => {
    const prayer = todaysPrayers[index];
    const shouldShowTomorrow = prayer.passed;
    setSelectedDate(shouldShowTomorrow ? 'tomorrow' : 'today');
  }, [index, todaysPrayers]);

  const prayer = selectedDate === 'tomorrow' ? tomorrowsPrayers[index] : todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;
  const shouldDim = !isPassed && !isNext && styles.dim;

  return (
    <Pressable
      style={[
        styles.container,
        isPassed && styles.passed,
        isNext && styles.next
      ]}
      onPress={toggleDate}
    >
      <Text style={[styles.text, styles.english, shouldDim]}> {prayer.english} </Text>
      <Text style={[styles.text, styles.arabic, shouldDim]}> {prayer.arabic} </Text>
      <Text style={[styles.text, styles.time, shouldDim]}> {prayer.time} </Text>
      <Alert index={index} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SCREEN.paddingHorizontal
  },
  dim: {
    opacity: 0.5
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
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
    marginLeft: 20,
    marginRight: 15,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
    marginRight: 34,
  },
  time: {
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
  active: {
    zIndex: 1
  }
});

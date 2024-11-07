import { StyleSheet, View, Text } from 'react-native';
import { useAtom } from 'jotai';

import { todaysPrayersAtom, nextPrayerIndexAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN, PRAYER } from '@/constants';
import Alert from './Alert';

interface Props {
  index: number;
}

export default function Prayer({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const textColor = isPassed || isNext ? COLORS.textPrimary : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <View style={[styles.content, isNext && styles.next]}>
        <Text style={[styles.text, styles.english, { color: textColor }]}>{prayer.english}</Text>
        <Text style={[styles.text, styles.arabic, { color: textColor }]}>{prayer.arabic}</Text>
        <Text style={[styles.text, styles.time, { color: textColor }]}>{prayer.time}</Text>
        <Alert index={index} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    height: PRAYER.height,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  next: {
    opacity: 1,
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
    marginLeft: 16,
  },
  arabic: {
    flex: 1,
    textAlign: 'right',
  },
  time: {
    flex: 1,
    textAlign: 'center',
    marginLeft: 25,
    marginRight: 10,
  }
});

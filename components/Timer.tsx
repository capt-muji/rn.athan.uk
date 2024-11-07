import { StyleSheet, Text, View } from 'react-native';
import { useAtom } from 'jotai';

import { COLORS, SCREEN, TEXT } from '@/constants';
import { nextPrayerIndexAtom } from '@/store/store';
import { useTimer } from '@/hooks/useTimer';

export default function Timer() {
  const { nextPrayer } = useTimer();
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  return (
    <View style={styles.container}>
      {nextPrayerIndex === -1 ? (
        <Text style={styles.text}>
          {nextPrayer.timerName}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            {`${nextPrayer.timerName || '...'} in`}
          </Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>
              {nextPrayer.timeDisplay}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    marginTop: SCREEN.paddingHorizontal,
    marginBottom: 35,
    zIndex: 1,
    justifyContent: 'center',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textSecondary,
    opacity: TEXT.opacity,
    textAlign: 'center',
    fontSize: TEXT.size - 2,
  },
  timer: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size + 5,
    textAlign: 'center',
  },
  timerContainer: {
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { StyleSheet, View } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { todaysPrayersAtom, nextPrayerIndexAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN, PRAYER, ANIMATION } from '@/constants';
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

  const textColor = isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent;

  const animatedStyle = useAnimatedStyle(() => {
    const shouldBeFullOpacity = isPassed || isNext;
    const baseOpacity = shouldBeFullOpacity ? 1 : TEXT.transparent;

    return {
      opacity: withTiming(baseOpacity, { duration: ANIMATION.duration })
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.content, isNext && styles.next]}>
        <Animated.Text style={[styles.text, styles.english, { color: textColor }, animatedStyle]}>
          {prayer.english}
        </Animated.Text>
        <Animated.Text style={[styles.text, styles.arabic, { color: textColor }, animatedStyle]}>
          {prayer.arabic}
        </Animated.Text>
        <Animated.Text style={[styles.text, styles.time, { color: textColor }, animatedStyle]}>
          {prayer.time}
        </Animated.Text>
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

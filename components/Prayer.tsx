import { useCallback } from 'react';
import { StyleSheet, Pressable, View, GestureResponderEvent } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ANIMATION } from '@/constants/animations';

import {
  todaysPrayersAtom,
  nextPrayerIndexAtom,
  tomorrowsPrayersAtom,
  selectedPrayerDateAtom,
  overlayAtom,
  selectedPrayerIndexAtom,
  overlayDateColorAtom
} from '@/store/store';
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
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [selectedPrayerIndex, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [isOverlay] = useAtom(overlayAtom);
  const [overlayDateColor] = useAtom(overlayDateColorAtom);

  const toggleDate = useCallback(() => {
    const prayer = todaysPrayers[index];
    const shouldShowTomorrow = prayer.passed;
    setSelectedDate(shouldShowTomorrow ? 'tomorrow' : 'today');
  }, [index, todaysPrayers]);

  const handlePress = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();

    if (isOverlay) {
      setIsOverlay(false);
      setSelectedPrayerIndex(null);
      setSelectedDate('today');
    } else {
      toggleDate();
      setIsOverlay(true);
      setSelectedPrayerIndex(index);
    }
  }, [toggleDate, index, isOverlay]);

  const prayer = selectedDate === 'tomorrow' ? tomorrowsPrayers[index] : todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const animatedStyle = useAnimatedStyle(() => {
    const isHidden = isOverlay && selectedPrayerIndex !== index;
    const isTomorrow = selectedDate === 'tomorrow';
    const shouldBeFullOpacity = isTomorrow || isPassed || isNext;
    const baseOpacity = shouldBeFullOpacity ? 1 : TEXT.opacity;

    return {
      opacity: withTiming(isHidden ? 0 : baseOpacity, { duration: ANIMATION.duration }),
      color: withTiming(overlayDateColor, { duration: ANIMATION.duration }),
    };
  });

  const textColor = isPassed || isNext ? COLORS.textPrimary : COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.pressable,
          isNext && styles.next
        ]}
        onPress={handlePress}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          <Animated.Text style={[styles.text, styles.english, { color: textColor }]}> {prayer.english} </Animated.Text>
          <Animated.Text style={[styles.text, styles.arabic, { color: textColor }]}> {prayer.arabic} </Animated.Text>
          <Animated.Text style={[styles.text, styles.time, { color: textColor }]}> {prayer.time} </Animated.Text>
        </Animated.View>
        <Alert index={index} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal
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
  },
  active: {
    zIndex: 1
  }
});

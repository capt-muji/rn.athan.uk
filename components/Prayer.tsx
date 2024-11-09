import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { todaysPrayersAtom, nextPrayerIndexAtom, activePrayerMeasurementsAtom, prayerMeasurementsAtom, overlayVisibleAtom, selectedPrayerIndexAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN, PRAYER, ANIMATION } from '@/constants';
import Alert from './Alert';

interface Props {
  index: number;
  isOverlay?: boolean;
}

export default function Prayer({ index, isOverlay }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setActiveMeasurements] = useAtom(activePrayerMeasurementsAtom);
  const [, setPrayerMeasurements] = useAtom(prayerMeasurementsAtom);
  const [, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const handleLayout = () => {
    if (!viewRef.current) return;
    
    viewRef.current.measureInWindow((x, y, width, height) => {
      const measurements = {
        pageX: x,
        pageY: y,
        width,
        height
      };
      
      setPrayerMeasurements(prev => ({
        ...prev,
        [index]: measurements
      }));
      
      if (isNext) {
        setActiveMeasurements(measurements);
      }
    });
  };

  const handlePress = () => {
    if (!isOverlay) {
      setSelectedPrayerIndex(index);
      setOverlayVisible(true);
    }
  };

  const textColor = isPassed || isNext ? COLORS.textPrimary : COLORS.textTransparent;

  const animatedStyle = useAnimatedStyle(() => {
    const shouldBeFullOpacity = isPassed || isNext;
    const baseOpacity = shouldBeFullOpacity ? 1 : TEXT.transparent;

    return {
      opacity: withTiming(baseOpacity, { duration: ANIMATION.duration })
    };
  });

  return (
    <Pressable
      ref={viewRef}
      onLayout={handleLayout}
      style={styles.container}
      onPress={handlePress}
    >
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
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
  text: {
    fontFamily: TEXT.famiy.regular,
    fontSize: TEXT.size,
    color: COLORS.textPrimary,
  },
  english: {
    flex: 1,
    marginLeft: 20,
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

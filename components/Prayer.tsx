import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { todaysPrayersAtom, nextPrayerIndexAtom, activePrayerMeasurementsAtom, prayerMeasurementsAtom, overlayVisibleAtom, selectedPrayerIndexAtom, prayerRelativeMeasurementsAtom, overlayContentAtom } from '@/store/store';
import { COLORS, TEXT, SCREEN, PRAYER, ANIMATION } from '@/constants';
import Alert from './Alert';

interface Props {
  index: number;
}

export default function Prayer({ index }: Props) {
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);
  const [, setActiveMeasurements] = useAtom(activePrayerMeasurementsAtom);
  const [prayerMeasurements, setPrayerMeasurements] = useAtom(prayerMeasurementsAtom);
  const [, setOverlayVisible] = useAtom(overlayVisibleAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setPrayerRelativeMeasurements] = useAtom(prayerRelativeMeasurementsAtom);
  const [, setOverlayContent] = useAtom(overlayContentAtom);
  const viewRef = useRef<View>(null);

  const prayer = todaysPrayers[index];
  const isPassed = prayer.passed;
  const isNext = index === nextPrayerIndex;

  const handleLayout = () => {
    if (!viewRef.current) return;

    // Measure window coordinates for overlay
    viewRef.current.measureInWindow((x, y, width, height) => {
      const windowMeasurements = {
        pageX: x,
        pageY: y,
        width,
        height
      };

      setPrayerMeasurements(prev => ({
        ...prev,
        [index]: windowMeasurements
      }));

      if (isNext) {
        setActiveMeasurements(windowMeasurements);
      }
    });

    // Measure relative coordinates for active background
    viewRef.current.measure((x, y, width, height) => {
      setPrayerRelativeMeasurements(prev => ({
        ...prev,
        [index]: { x, y, width, height }
      }));
    });
  };

  const handlePress = () => {
    setOverlayContent(prev => [...prev, {
      name: `prayer-${index}`,
      component: <Prayer index={index} />,
      measurements: prayerMeasurements[index]
    }]);
    setOverlayVisible(true);
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

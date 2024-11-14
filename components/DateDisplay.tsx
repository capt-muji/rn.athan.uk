import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { absoluteDateMeasurementsAtom, overlayVisibleAtom, todaysPrayersAtom } from '@/store/store';
import { COLORS, SCREEN, TEXT, OVERLAY, ANIMATION } from '@/constants';
import Masjid from './Masjid';

export default function DateDisplay() {
  const [, setDateMeasurements] = useAtom(absoluteDateMeasurementsAtom);
  const [overlayVisible] = useAtom(overlayVisibleAtom);
  const [todaysPrayers] = useAtom(todaysPrayersAtom);
  const dateRef = useRef<Animated.Text>(null);
  const dateOpacity = useSharedValue(1);

  // Get first prayer's date from storage data
  const storedDate = Object.values(todaysPrayers)[0]?.date;

  const formattedDate = storedDate
    ? new Date(storedDate).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
    : '';

  useEffect(() => {
    if (overlayVisible) {
      dateOpacity.value = withTiming(0, { duration: ANIMATION.duration });
    } else {
      dateOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
    }
  }, [overlayVisible]);

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacity.value,
  }));

  const handleLayout = () => {
    if (!dateRef.current) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      setDateMeasurements({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text ref={dateRef} onLayout={handleLayout} style={[styles.date, dateAnimatedStyle]}>
          {formattedDate}
        </Animated.Text>
      </View>
      <Masjid />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN.paddingHorizontal,
    zIndex: OVERLAY.zindexes.off.longDate,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.size - 2,
    fontFamily: TEXT.famiy.regular,
    marginBottom: 5,
    opacity: TEXT.opacity
  },
  date: {
    fontFamily: TEXT.famiy.regular,
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
  overlayText: {
    color: COLORS.textSecondary,
  }
});

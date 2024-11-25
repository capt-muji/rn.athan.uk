import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAtomValue } from 'jotai';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { COLORS, SCREEN, TEXT, OVERLAY, ANIMATION } from '@/shared/constants';
import Masjid from './Masjid';
import { formatDateLong } from '@/shared/time';
import { dateAtom } from '@/stores/store';

export default function DateDisplay() {
  const isOverlayOn = false;

  const date = useAtomValue(dateAtom);
  const dateRef = useRef<Animated.Text>(null);
  const dateOpacity = useSharedValue(1);

  useEffect(() => {
    if (isOverlayOn) {
      dateOpacity.value = withTiming(0, { duration: ANIMATION.duration });
    } else {
      dateOpacity.value = withDelay(ANIMATION.overlayDelay, withTiming(1, { duration: ANIMATION.duration }));
    }
  }, [isOverlayOn]);

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacity.value,
  }));

  // const handleLayout = () => {
  //   if (!dateRef.current) return;

  //   dateRef.current.measureInWindow((x, y, width, height) => {
  //     date.setMeasurements({ pageX: x, pageY: y, width, height });
  //   });
  // };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text ref={dateRef} style={[styles.date, dateAnimatedStyle]}>
          {formatDateLong(date.current)}
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
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.famiy.regular,
    marginBottom: 5,
  },
  date: {
    fontFamily: TEXT.famiy.regular,
    color: 'white',
    fontSize: TEXT.size,
  },
  overlayText: {
    color: COLORS.textSecondary,
  }
});

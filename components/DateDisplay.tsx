import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAtom } from 'jotai';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
// import { absoluteDateMeasurementsAtom, overlayVisibleAtom, dateTodayAtom } from '@/stores/store';
import { COLORS, SCREEN, TEXT, OVERLAY, ANIMATION } from '@/shared/constants';
import Masjid from './Masjid';
import { formatDate } from '@/shared/time';
import useBaseStore from '@/hooks/useBaseStore';

export default function DateDisplay() {
  const { date, isOverlayOn } = useBaseStore('standard');
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
          {formatDate(date)}
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
    opacity: TEXT.opacityHigher
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

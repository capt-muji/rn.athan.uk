import { useAtomValue } from 'jotai';
import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';

import Masjid from '@/components/Masjid';
import { COLORS, SCREEN, TEXT, OVERLAY, ANIMATION } from '@/shared/constants';
import { formatDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/actions';
import { dateAtom } from '@/stores/store';

interface Props {
  type: ScheduleType;
}

export default function Day({ type }: Props) {
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

  const handleLayout = () => {
    // Only measure for 1st screen
    if (!dateRef.current || type !== ScheduleType.Standard) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      setMeasurement('date', { pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text ref={dateRef} onLayout={handleLayout} style={[styles.date, dateAnimatedStyle]}>
          {formatDateLong(date)}
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
  },
});

import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import Masjid from '@/components/Masjid';
import { useAnimationOpacity } from '@/hooks/useAnimations';
import { COLORS, SCREEN, TEXT, ANIMATION } from '@/shared/constants';
import { formatDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/actions';
import { dateAtom, overlayAtom } from '@/stores/store';

interface Props {
  type: ScheduleType;
}

export default function Day({ type }: Props) {
  const date = useAtomValue(dateAtom);
  const overlay = useAtomValue(overlayAtom);

  const dateOpacity = useAnimationOpacity(1);

  const dateRef = useRef<Animated.Text>(null);

  if (overlay.isOn) {
    dateOpacity.animate(0, { duration: ANIMATION.duration });
  } else {
    dateOpacity.animate(1, { duration: ANIMATION.duration, delay: ANIMATION.overlayDelay });
  }

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
        <Animated.Text ref={dateRef} onLayout={handleLayout} style={[styles.date, dateOpacity.style]}>
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

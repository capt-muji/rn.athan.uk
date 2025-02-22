import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';

import Masjid from '@/components/Masjid';
import { COLORS, SCREEN, TEXT } from '@/shared/constants';
import { formatDateLong } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/sync';
import { setMeasurementsDate } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Day({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  const date = useAtomValue(dateAtom);
  const dateRef = useRef<Animated.Text>(null);

  const handleLayout = () => {
    // Only measure 1st screen
    if (!dateRef.current || !isStandard) return;

    dateRef.current.measureInWindow((x, y, width, height) => {
      setMeasurementsDate({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.location}>London, UK</Text>
        <Animated.Text ref={dateRef} onLayout={handleLayout} style={styles.date}>
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
    paddingRight: SCREEN.paddingHorizontal + 2,
    paddingLeft: SCREEN.paddingHorizontal + 4,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    marginBottom: 5,
  },
  date: {
    fontFamily: TEXT.family.regular,
    color: 'white',
    fontSize: TEXT.size,
  },
  overlayText: {
    color: COLORS.textSecondary,
  },
});

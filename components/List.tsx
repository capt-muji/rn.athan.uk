import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { usePrayer } from '@/hooks/usePrayer';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH, SCREEN } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { setMeasurements } from '@/stores/actions';
import { dateAtom } from '@/stores/store';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  const { isStandard } = usePrayer(0, type);
  const date = useAtomValue(dateAtom);
  const listRef = useRef<View>(null);

  const isFriday = TimeUtils.isFriday(date);

  const indexes = isStandard ? PRAYERS_ENGLISH : isFriday ? [0, 1, 2] : EXTRAS_ENGLISH;

  const handleLayout = () => {
    // Only measure for 1st screen
    if (!listRef.current || type !== ScheduleType.Standard) return;

    listRef.current.measureInWindow((x, y, width, height) => {
      setMeasurements.list({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View ref={listRef} onLayout={handleLayout} style={[styles.container]}>
      <ActiveBackground type={type} />
      {indexes.map((_, index) => (
        <Prayer key={index} index={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
  },
});

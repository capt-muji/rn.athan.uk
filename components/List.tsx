import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { SCHEDULE_LENGTHS, SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/overlay';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  const listRef = useRef<View>(null);

  const handleLayout = () => {
    // Only measure 1st screen
    if (!listRef.current || !isStandard) return;

    listRef.current.measureInWindow((x, y, width, height) => {
      setMeasurement('list', { pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View ref={listRef} onLayout={handleLayout} style={[styles.container]}>
      <ActiveBackground type={type} />
      {Array.from({ length: SCHEDULE_LENGTHS[type] }).map((_, index) => (
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

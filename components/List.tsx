import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { SCHEDULE_LENGTHS, SCREEN, TEXT } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/sync';
import { getMeasurementsList, setMeasurementsList } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  useAtomValue(dateAtom); // Make component reactive to date changes

  const isStandard = type === ScheduleType.Standard;
  const listRef = useRef<View>(null);

  const scheduleLength = isStandard ? SCHEDULE_LENGTHS.standard : SCHEDULE_LENGTHS.extra;

  const handleLayout = () => {
    if (!listRef.current || !isStandard) return;

    const cachedMeasurements = getMeasurementsList();
    if (cachedMeasurements.width > 0) return;

    listRef.current.measureInWindow((x, y, width, height) => {
      const measurements = { pageX: x, pageY: y, width, height };
      setMeasurementsList(measurements);
    });
  };

  return (
    <View ref={listRef} onLayout={handleLayout} style={[styles.container]}>
      <ActiveBackground type={type} />
      {Array.from({ length: scheduleLength }).map((_, index) => (
        <Prayer key={index} index={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
  },
  hiddenText: {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    zIndex: -1000,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    backgroundColor: 'green',
  },
});

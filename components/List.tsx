import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import ActiveBackground from '@/components/ActiveBackground';
import Prayer from '@/components/Prayer';
import { SCHEDULE_LENGTHS, SCREEN, TEXT } from '@/shared/constants';
import * as TimeUtils from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import { setMeasurement } from '@/stores/overlay';
import { dateAtom } from '@/stores/sync';

interface Props {
  type: ScheduleType;
}

export default function List({ type }: Props) {
  useAtomValue(dateAtom);
  const isStandard = type === ScheduleType.Standard;
  const listRef = useRef<View>(null);

  const scheduleLength = isStandard
    ? SCHEDULE_LENGTHS.standard
    : TimeUtils.isFriday()
      ? SCHEDULE_LENGTHS.extra
      : SCHEDULE_LENGTHS.extra - 1;

  const handleLayout = () => {
    if (!listRef.current || !isStandard) return;
    listRef.current.measureInWindow((x, y, width, height) => {
      setMeasurement('list', { pageX: x, pageY: y, width, height });
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

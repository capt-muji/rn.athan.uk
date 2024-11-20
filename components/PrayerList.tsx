import { View, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/store';
import { ScheduleType } from '@/shared/types';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { useState } from 'react';

interface Props {
  type: ScheduleType;
}

export default function PrayerList({ type }: Props) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setDimensions({ width, height });
      }}
    >
      <ActiveBackground type={type} dimensions={dimensions} />
      {Object.keys(schedule.today).map((_, index) => (
        <Prayer key={index} index={index} type={type} />
      ))}
    </View>
  );
};
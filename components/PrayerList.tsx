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
  const [listHeight, setListHeight] = useState(0);
  const isStandard = type === ScheduleType.Standard;
  const schedule = useAtomValue(isStandard ? standardScheduleAtom : extraScheduleAtom);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
    >
      <ActiveBackground type={type} listHeight={listHeight} />
      {Object.keys(schedule.today).map((_, index) => (
        <Prayer key={index} index={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  }
});
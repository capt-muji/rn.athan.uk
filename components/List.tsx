import { View, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';

import Prayer from '@/components/Prayer';
import ActiveBackground from '@/components/ActiveBackground';
import { EXTRAS_ENGLISH, PRAYERS_ENGLISH, SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/store';
import * as TimeUtils from '@/shared/time';
import { usePrayer } from '@/hooks/usePrayer';

interface Props { type: ScheduleType }

export default function List({ type }: Props) {
  const { isStandard } = usePrayer(0, type);
  const date = useAtomValue(dateAtom);

  const isFriday = TimeUtils.isFriday(date.current);

  const indices = isStandard
    ? PRAYERS_ENGLISH
    : isFriday
      ? [0, 1] // only show Istijaba on fridays
      : EXTRAS_ENGLISH;

  return (
    <View style={[styles.container]}>
      <ActiveBackground type={type} />
      {indices.map((_, index) => (
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
import { View, StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';

import Prayer from '@/components/Prayer';
import ActiveBackground from '@/components/ActiveBackground';
import { SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { dateAtom } from '@/stores/store';
import * as timeUtils from '@/shared/time';
import { usePrayer } from '@/hooks/usePrayer';

interface Props { type: ScheduleType }

export default function PrayerList({ type }: Props) {
  const { isStandard } = usePrayer(0, type);
  const date = useAtomValue(dateAtom);

  const isFriday = timeUtils.isFriday(date.current);

  const indices = isStandard
    ? [0, 1, 2, 3, 4, 5]
    : isFriday ? [0, 1] : [0, 1, 2];

  return (
    <View style={[styles.container, { marginBottom: isStandard ? 0 : 25 }]}>
      <ActiveBackground type={type} />
      {indices.map(index => (
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
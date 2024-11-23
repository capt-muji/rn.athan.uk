import { View, StyleSheet } from 'react-native';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { PRAYERS_LENGTH_FAJR_TO_ISHA, SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

interface Props { type: ScheduleType }

export default function PrayerList({ type }: Props) {
  const isStandard = type === ScheduleType.Standard;

  const computedStyles = {
    marginBottom: isStandard ? 0 : 25,
  };

  return (
    <View style={[styles.container, computedStyles]}>
      {/* <ActiveBackground type={type} /> */}
      {isStandard && <Prayer index={0} type={type} />}
      {isStandard && <Prayer index={1} type={type} />}
      {isStandard && <Prayer index={2} type={type} />}
      {isStandard && <Prayer index={3} type={type} />}
      {isStandard && <Prayer index={4} type={type} />}
      {isStandard && <Prayer index={5} type={type} />}
      {!isStandard && <Prayer index={0} type={type} />}
      {!isStandard && <Prayer index={1} type={type} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
  },
});
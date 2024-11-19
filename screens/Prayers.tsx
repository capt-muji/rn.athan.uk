import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Countdown from '@/components/Countdown';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import ActiveBackground from '@/components/ActiveBackground';
import Overlay from '@/components/Overlay';
import { SCREEN, PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '@/shared/constants';
import RadialGlow from '@/components/RadialGlow';
import { ScheduleType } from '@/shared/types';
import useSchedule from '@/hooks/useSchedule';

interface Props {
  type: ScheduleType;
}

export default function Prayers({ type }: Props) {
  const { today } = useSchedule(type);

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SCREEN.paddingHorizontal, paddingBottom: insets.bottom }]}>
      <Countdown type={type} />
      <DateDisplay />
      <ActiveBackground type={type} />
      {Object.keys(today()).map((_, index) => (
        <Prayer key={index} index={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
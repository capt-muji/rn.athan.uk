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
import { standardScheduleAtom, extraScheduleAtom } from '@/stores/store';
import { useAtomValue } from 'jotai';
import PrayerList from '@/components/PrayerList';

export default function Prayers() {
  const insets = useSafeAreaInsets();

  const type = ScheduleType.Extra;

  const computedStyles = {
    paddingTop: insets.top + SCREEN.paddingHorizontal,
    paddingBottom: insets.bottom
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, computedStyles]}>
      <Countdown type={type} />
      <DateDisplay />
      <PrayerList type={type} />
    </View>
  );
};
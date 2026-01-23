import { useAtomValue } from 'jotai';
import { Platform, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Countdown from '@/components/Countdown';
import Day from '@/components/Day';
import List from '@/components/List';
import PrayerAgo from '@/components/PrayerAgo';
import { SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import { showTimePassedAtom } from '@/stores/ui';

interface Props {
  type: ScheduleType;
}

export default function Screen({ type }: Props) {
  const insets = useSafeAreaInsets();
  const showTimePassed = useAtomValue(showTimePassedAtom);

  const computedStyles: ViewStyle = {
    paddingTop: insets.top + SCREEN.paddingTop,
    paddingBottom: insets.bottom + (Platform.OS === 'android' ? 15 : 0),
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
  };

  return (
    <View style={[{ flex: 1 }, computedStyles]}>
      <Countdown type={type} />
      <Day type={type} />
      <List type={type} />

      {showTimePassed && <PrayerAgo type={type} />}

      {/* Spacing */}
      <View style={{ flex: 1 }} />
    </View>
  );
}

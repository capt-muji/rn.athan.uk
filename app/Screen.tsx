import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Countdown from '@/components/Countdown';
import Day from '@/components/Day';
import List from '@/components/List';
import { SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

interface Props {
  type: ScheduleType;
}

export default function Screen({ type }: Props) {
  const insets = useSafeAreaInsets();

  const computedStyles = {
    paddingTop: insets.top + SCREEN.paddingHorizontal,
    paddingBottom: insets.bottom,
  };

  return (
    <View style={[{ flex: 1 }, computedStyles]}>
      <Countdown type={type} />
      <Day type={type} />
      <List type={type} />
    </View>
  );
}

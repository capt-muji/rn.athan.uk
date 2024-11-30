import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Countdown from '@/components/Countdown';
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
    <View style={[StyleSheet.absoluteFillObject, computedStyles]}>
      <Countdown type={type} />
      {/* <Day /> */}
      <List type={type} />
    </View>
  );
}

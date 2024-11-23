import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Countdown from '@/components/Countdown';
import { SCREEN } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';
import Card from '@/components/Card';

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

      <View style={styles.cards}>
        <Card index={0} />
        <Card index={1} />
        <Card index={2} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cards: {
    marginTop: 15,
    gap: 15
  }
});
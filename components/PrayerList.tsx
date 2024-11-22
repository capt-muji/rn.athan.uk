import { View, StyleSheet } from 'react-native';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { PRAYERS_ENGLISH, SCREEN } from '@/shared/constants';

export default function PrayerList() {
  const allIndexesButLast = PRAYERS_ENGLISH.length - 1;

  return (
    <View style={styles.container}>
      <ActiveBackground />
      {Array.from({ length: allIndexesButLast }).map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    marginBottom: 25,
  },
});
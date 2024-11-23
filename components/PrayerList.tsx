import { View, StyleSheet } from 'react-native';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { PRAYERS_LENGTH_FAJR_TO_ISHA, SCREEN } from '@/shared/constants';

export default function PrayerList() {
  return (
    <View style={styles.container}>
      <ActiveBackground />
      {Array.from({ length: PRAYERS_LENGTH_FAJR_TO_ISHA }).map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    marginBottom: 80,
  },
});
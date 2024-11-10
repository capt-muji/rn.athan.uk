import { View, StyleSheet } from 'react-native';
import { ENGLISH, SCREEN } from '@/constants';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';

export default function PrayersList() {
  return (
    <View style={styles.container}>
      <ActiveBackground />
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: SCREEN.paddingHorizontal,
  }
});
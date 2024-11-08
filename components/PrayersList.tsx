import { View, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import { nextPrayerIndexAtom } from '@/store/store';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { ENGLISH } from '@/constants';

export default function PrayersList() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

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
    width: '100%',
  }
});
import { StyleSheet, View } from 'react-native';
import { useAtom } from 'jotai';
import { nextPrayerIndexAtom } from '@/store/store';
import { COLORS, SCREEN, PRAYER } from '@/constants';
import Prayer from './Prayer';
import { ENGLISH } from '@/constants';

export default function PrayersList() {
  const [nextPrayerIndex] = useAtom(nextPrayerIndexAtom);

  return (
    <View style={styles.container}>
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PRAYER.height * ENGLISH.length, // 7 prayers * 60px height
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    left: SCREEN.paddingHorizontal,
    right: SCREEN.paddingHorizontal,
    height: PRAYER.height,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    borderRadius: 5,
    shadowColor: COLORS.primaryShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  }
});

import { Pressable, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';

import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import PrayersList from '@/components/PrayersList';
import Footer from '@/components/Footer';
import { overlayAtom, selectedPrayerIndexAtom, selectedPrayerDateAtom } from '@/store/store';

export default function Main() {
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setSelectedDate] = useAtom(selectedPrayerDateAtom);

  const handleOverlay = () => {
    setIsOverlay(false);
    setSelectedPrayerIndex(null);
    setSelectedDate('today');
  };

  return (
    <Pressable style={styles.container} onPress={handleOverlay}>
      <Timer />
      <DateDisplay />
      <PrayersList />
      <Footer />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
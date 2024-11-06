import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';

import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import { ENGLISH } from '@/constants';
import { overlayAtom, selectedPrayerIndexAtom, selectedPrayerDateAtom } from '@/store/store';

export default function Main() {
  const [, setIsOverlay] = useAtom(overlayAtom);
  const [, setSelectedPrayerIndex] = useAtom(selectedPrayerIndexAtom);
  const [, setSelectedDate] = useAtom(selectedPrayerDateAtom);

  const handlePress = () => {
    setIsOverlay(false);
    setSelectedPrayerIndex(null);
    setSelectedDate('today');
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Timer />
      <DateDisplay />
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
      <Footer />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
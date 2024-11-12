import { StyleSheet, View } from 'react-native';
import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import ActiveBackground from '@/components/ActiveBackground';
import { SCREEN, ENGLISH } from '@/constants';
import { useAtom } from 'jotai';
import { absolutePrayerListMeasurementsAtom } from '@/store/store';
import { useRef } from 'react';

export default function Main() {
  const [, setPrayerListMeasurements] = useAtom(absolutePrayerListMeasurementsAtom);
  const viewRef = useRef<View>(null);

  const handleLayout = () => {
    if (!viewRef.current) return;
    viewRef.current.measureInWindow((x, y, width, height) => {
      setPrayerListMeasurements({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View style={styles.container}>
      <Timer />
      <DateDisplay />
      <View ref={viewRef} onLayout={handleLayout} style={styles.prayersContainer}>
        <ActiveBackground />
        {ENGLISH.map((_, index) => (
          <Prayer key={index} index={index} />
        ))}
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SCREEN.paddingHorizontal,
  },
  prayersContainer: {
    marginHorizontal: SCREEN.paddingHorizontal,
  }
});
import { View, StyleSheet } from 'react-native';
import { useAtom } from 'jotai';
import { ENGLISH, SCREEN } from '@/constants';
import { absolutePrayerListMeasurementsAtom } from '@/store/store';
import Prayer from './Prayer';
import ActiveBackground from './ActiveBackground';
import { useRef } from 'react';

interface Props { isOverlay?: boolean }

export default function PrayersList({ isOverlay = false }: Props) {
  const [, setPrayerListMeasurements] = useAtom(absolutePrayerListMeasurementsAtom);
  const viewRef = useRef<View>(null);

  const handleLayout = () => {
    if (!viewRef.current || isOverlay) return;

    viewRef.current.measureInWindow((x, y, width, height) => {
      setPrayerListMeasurements({ pageX: x, pageY: y, width, height });
    });
  };

  return (
    <View ref={viewRef} onLayout={handleLayout} style={!isOverlay && styles.margin}>
      {!isOverlay && <ActiveBackground />}
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} isOverlay={isOverlay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  margin: {
    marginHorizontal: SCREEN.paddingHorizontal,
  }
});
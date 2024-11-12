import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal } from 'react-native-paper';
import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import ActiveBackground from '@/components/ActiveBackground';
import Overlay from '@/components/Overlay';
import { SCREEN, ENGLISH } from '@/constants';

export default function Main() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SCREEN.paddingHorizontal }]}>
      <Overlay />
      <ActiveBackground />

      <Timer />
      <DateDisplay />

      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
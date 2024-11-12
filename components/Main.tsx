import { StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';
import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import ActiveBackground from '@/components/ActiveBackground';
import Overlay from '@/components/Overlay';
import { SCREEN, ENGLISH } from '@/constants';

export default function Main() {
  return (
    <Portal.Host>
      <View style={styles.container}>
        <Overlay />
        <Timer />
        <DateDisplay />
        {ENGLISH.map((_, index) => (
          <Prayer key={index} index={index} />
        ))}
        <ActiveBackground />
        <Footer />
      </View>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SCREEN.paddingHorizontal,
  },
});
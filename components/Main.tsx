import { StyleSheet, View } from 'react-native';
import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import ActiveBackground from '@/components/ActiveBackground';
import { SCREEN, ENGLISH } from '@/constants';

export default function Main() {
  return (
    <View style={styles.container}>
      <Timer />
      <DateDisplay />
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
      <ActiveBackground />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SCREEN.paddingHorizontal,
  },
});
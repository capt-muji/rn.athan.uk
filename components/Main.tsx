import { StyleSheet, View } from 'react-native';
import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import PrayersList from '@/components/PrayersList';
import Footer from '@/components/Footer';
import { SCREEN } from '@/constants';

export default function Main() {
  return (
    <View style={styles.container}>
      <Timer />
      <DateDisplay />
      <PrayersList />
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
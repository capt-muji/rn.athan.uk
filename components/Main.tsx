import { StyleSheet, View } from 'react-native';
import Countdown from '@/components/Countdown';
import DateDisplay from '@/components/DateDisplay';
import PrayerList from '@/components/PrayerList';
import PrayerLastThird from '@/components/PrayerLastThird';

export default function Main() {
  return (
    <View style={styles.container}>
      <Countdown />
      <DateDisplay />
      <PrayerList />
      <PrayerLastThird />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  }
});

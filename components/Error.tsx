import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Masjid from '@/components/Masjid';
import { TEXT } from '@/shared/constants';
import * as Database from '@/stores/database';

export default function Error() {
  const handleRefresh = async () => {
    Database.cleanup();
    await Updates.reloadAsync(); // force reload the entire app
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading]}> Oh no! </Text>
      <Text style={[styles.subtext, styles.first]}> Something went wrong. </Text>
      <Text style={[styles.subtext, styles.last]}> Try refreshing! </Text>
      <Masjid height={65} width={60} />
      <Pressable style={styles.button} onPress={handleRefresh}>
        <Text style={[styles.subtext]}> Refresh </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: 'white',
    fontSize: 28,
    marginBottom: 18,
    fontFamily: TEXT.family.medium,
  },
  subtext: {
    color: 'white',
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  first: {
    marginBottom: 4,
  },
  last: {
    marginBottom: 50,
  },
  button: {
    marginTop: 50,
    flexDirection: 'row',
    backgroundColor: '#030005',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 5,
  },
  icon: {
    marginRight: 10,
  },
});

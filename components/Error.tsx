import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Masjid from '@/components/Masjid';
import { COLORS, TEXT, SPACING, RADIUS } from '@/shared/constants';
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
    color: COLORS.text.primary,
    fontSize: TEXT.sizeHeading,
    marginBottom: SPACING.lg2,
    fontFamily: TEXT.family.medium,
  },
  subtext: {
    color: COLORS.text.primary,
    fontSize: TEXT.size,
    fontFamily: TEXT.family.regular,
  },
  first: {
    marginBottom: SPACING.xs,
  },
  last: {
    marginBottom: SPACING.section,
  },
  button: {
    marginTop: SPACING.section,
    flexDirection: 'row',
    backgroundColor: COLORS.error.buttonBackground,
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.lg2,
    borderRadius: RADIUS.sm,
  },
});

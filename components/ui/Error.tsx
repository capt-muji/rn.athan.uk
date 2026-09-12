import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import logger from '@/shared/logger';

import Masjid from './Masjid';

export default function ErrorScreen() {
  /**
   * Reloads and retries. Deliberately destroys nothing.
   *
   * This used to call `clearAllExcept(['app_installed_version', 'preference_'])`
   * first, which deleted every `prayer_YYYY-MM-DD` record, `fetched_years`, the
   * scheduled-notification bookkeeping, the cache shape marker and the measured
   * column widths that ISSUES #22 and #16 deliberately added to both other
   * keep-lists. The screen is reached from a failed fetch, so the common case was
   * an offline user with a perfectly good timetable on disk: the one button
   * offered to them turned a recoverable state into an unrecoverable one, and
   * every further reload found nothing and came straight back here.
   */
  const handleRefresh = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      logger.error('ERROR SCREEN: Reload failed', { error });
    }
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

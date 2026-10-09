import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import logger from '@/shared/logger';
import { clearUpgradeCache } from '@/stores/version';

import Masjid from './Masjid';

export default function ErrorScreen() {
  /**
   * Clears the cache and reloads. Owner ruling, 2026-09-12: reaching this screen
   * means something has gone wrong, so refetching from scratch is the recovery,
   * and the destruction is acceptable because preferences survive it.
   *
   * Goes through `clearUpgradeCache` rather than a bare `clearAllExcept`, which
   * keeps strictly more of what the app cannot refetch. The previous inline list
   * kept only `app_installed_version` and `preference_`, so it also dropped
   * `cache_schema_version` and the `prayer_max_english_width_` measurements that
   * ISSUES #22 and #16 deliberately preserve — losing those reflows the prayer
   * list on the next launch, which is a visible regression this screen has no
   * reason to cause. Alert settings, the sound choice and every other
   * `preference_` key survive either way.
   */
  const handleRefresh = async () => {
    logger.warn('ERROR SCREEN: Clearing cached data and reloading');
    try {
      clearUpgradeCache();
      await Updates.reloadAsync(); // force reload the entire app
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

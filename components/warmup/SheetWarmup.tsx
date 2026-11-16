/**
 * The idle ladder's warm copy of the likely sheet bodies (T-327 step 24,
 * digest 5101 approach A): the settings body (the one sheet the home
 * screen's own chrome opens) and the alert body (any bell press), mounted
 * once at idle on a host pinned off-screen at top -10000 — the
 * InitialWidthMeasurement precedent — with the content width the sheets'
 * own column gives them, so the measurements the copies take are the values
 * the real sheets will measure.
 *
 * What warms: the component code, the catalogs' strings, the font shaping
 * and the measured geometry. What cannot: the library's portal mount at
 * each sheet's first present, which stays in that open (and is small beside
 * the content render). The copies never present, never fire a sheet's
 * onFirstPresent (the sound list stays settings' own warming), and never
 * write a store — the alert body's drafts are body-local, and the geometry
 * cache is written only through the ladder's settle-tick seal.
 */

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AlertSheetBody } from '@/components/sheets/screens/Alert';
import { SettingsBody } from '@/components/sheets/screens/Settings';
import { type PrayerId, SIZE, SPACING } from '@/shared/constants';
import { ScheduleType } from '@/shared/types';

/** The row the warm alert body stands for: the list's first, whose saved alerts the body renders */
const WARMUP_ALERT_STATE = {
  type: ScheduleType.Standard,
  index: 0,
  prayerId: 'fajr' as PrayerId,
  isUnavailable: false,
  session: 0,
};

/** The copy's permission stand-in: permissive, and unreachable through the pointerEvents-none host */
export const warmupEnsurePermissions = () => Promise.resolve(true);

export default function SheetWarmup() {
  const { width: windowWidth } = useWindowDimensions();

  return (
    <View
      style={[styles.offscreen, { width: Math.min(windowWidth, SIZE.contentMaxWidth) - 2 * SPACING.xl }]}
      pointerEvents={'none'}
      accessibilityElementsHidden
      importantForAccessibility={'no-hide-descendants'}>
      <SettingsBody />
      <AlertSheetBody
        sheetState={WARMUP_ALERT_STATE}
        session={WARMUP_ALERT_STATE.session}
        ensurePermissions={warmupEnsurePermissions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -10000,
    start: 0,
  },
});

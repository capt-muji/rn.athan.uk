/**
 * The extras row's fasting indicator (design 427): the bordered identity
 * cluster riding the Suhoor row's alerts bell - the armed identities drawn
 * white-first, so the regimen circle sits on top at the right and the white
 * circle beneath it at the left, a lone identity in the right slot (owner
 * ruling 2026-11-06) - every circle ringed in the deep background shade
 * hugging the fill - drawn only while the selection is not Every day and the
 * row's own alert is not Off: nothing is scheduled under an off alert, so
 * nothing draws. The cluster reads the committed selection atoms and the
 * Suhoor row's own alert atom, so a change made on the sheet's card lands
 * here the moment the sheet commits. The layer's anchor is logical
 * (start 25): in a mirrored locale the cluster rides the bell's mirrored
 * corner, the same corner of the row it decorates.
 */

import { useAtomValue } from 'jotai';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { FASTING_BELL_DOT, FASTING_BELL_RING, FastingRingCluster } from '@/components/ui/FastingDots';
import { useDerivedOpacity } from '@/hooks/useAnimation';
import { ANIMATION } from '@/shared/constants';
import { validFastingMode } from '@/shared/fasting';
import { armedFastingIdentities, hasFastingIdentities } from '@/shared/fastingSchedule';
import { sanitizeFastingSelection } from '@/shared/fastingSelection';
import { AlertType, ScheduleType } from '@/shared/types';
import {
  canonicalPrayerIndex,
  fastingModeAtom,
  fastingWhiteDaysAtom,
  getPrayerAlertAtom,
} from '@/stores/notifications';

/**
 * The Suhoor row's bell-corner cluster
 *
 * @param hidden Whether the overlay is veiling this row: the cluster is
 * dots, not text, so it sinks through the wrapper's own opacity exactly as
 * the bell it rides does, instead of outliving it mid-fade
 */
export default function FastingBellCluster({ hidden }: { readonly hidden: boolean }) {
  const mode = useAtomValue(fastingModeAtom);
  const whiteDaysAddOn = useAtomValue(fastingWhiteDaysAtom);
  const suhoorAlert = useAtomValue(
    getPrayerAlertAtom(ScheduleType.Extra, canonicalPrayerIndex(ScheduleType.Extra, 'suhoor', 0))
  );

  // Drawn white-first (draw order left to right), so the regimen lands on top
  // at the right and the white days beneath at the left (owner ruling 2026-11-06)
  const stacked = armedFastingIdentities(
    sanitizeFastingSelection({ mode: validFastingMode(mode), whiteDaysAddOn })
  ).reverse();

  const veilStyle = useDerivedOpacity(hidden ? 0 : 1, { duration: ANIMATION.duration });

  if (suhoorAlert === AlertType.Off || !hasFastingIdentities(stacked)) return null;

  return (
    <Animated.View testID={'fasting-bell-cluster'} style={[styles.layer, veilStyle]} pointerEvents={'none'}>
      <FastingRingCluster identities={stacked} size={FASTING_BELL_DOT} ring={FASTING_BELL_RING} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 10,
    start: 25,
  },
});

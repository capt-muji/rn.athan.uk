/**
 * The extras row's fasting indicator (design 427): the bordered identity
 * cluster riding the Suhoor row's alerts bell - the armed identities in
 * regimen order, the white circle right of its partner and on top, every
 * circle ringed in the deep background shade hugging the fill - drawn only
 * while the selection is not Every day. The cluster reads the committed
 * selection atoms, so a change made on the sheet's card lands here the
 * moment the sheet commits. The layer's anchor is logical (start 25): in a
 * mirrored locale the cluster rides the bell's mirrored corner, the same
 * corner of the row it decorates.
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
import { fastingModeAtom, fastingWhiteDaysAtom } from '@/stores/notifications';

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

  const identities = armedFastingIdentities(sanitizeFastingSelection({ mode: validFastingMode(mode), whiteDaysAddOn }));

  const veilStyle = useDerivedOpacity(hidden ? 0 : 1, { duration: ANIMATION.duration });

  if (!hasFastingIdentities(identities)) return null;

  return (
    <Animated.View testID={'fasting-bell-cluster'} style={[styles.layer, veilStyle]} pointerEvents={'none'}>
      <FastingRingCluster identities={identities} size={FASTING_BELL_DOT} ring={FASTING_BELL_RING} />
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

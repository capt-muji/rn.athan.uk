import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import QiblaMap from '@/components/qibla/QiblaMap';
import { IconView } from '@/components/ui';
import { useQiblaMap } from '@/hooks/useQiblaMap';
import { COLORS, RADIUS, SPACING, TEXT } from '@/shared/constants';
import { qiblaSentence } from '@/shared/qiblaSentence';
import { Icon } from '@/shared/types';
import { setQiblaSheetModal } from '@/stores/ui';

import { Sheet } from '../parts';

/** Names the condition plainly, never apologising for the reading and never blaming the phone */
const WITHOUT_A_MAP: Record<'looking' | 'unavailable' | 'nomap', string> = {
  looking: 'Finding your position',
  unavailable: 'Your location is not available right now',
  nomap: 'No map data for this spot',
};

/**
 * The qibla, drawn against the streets around the user
 *
 * No sensor is read anywhere on this screen. The bearing is arithmetic and a street's direction is a fact of the
 * ground held in the map data, so neither can be bent by the steel in a room: the magnetometer dial this replaced
 * measured 30 degrees wrong indoors while printing a confident three-figure number.
 */
export default function BottomSheetQibla() {
  const { state, start } = useQiblaMap();

  // Keyed on presentation, never on mount: every sheet is mounted from launch, so a mount-keyed read would fetch
  // tiles on every device, forever, for a screen the user may never open.
  const handlePresent = useCallback(() => start(), [start]);

  return (
    <Sheet
      setRef={setQiblaSheetModal}
      title='Qibla'
      subtitle='The direction of prayer'
      icon={<IconView type={Icon.COMPASS} size={16} color='rgba(165, 180, 252, 0.8)' />}
      snapPoints={['85%']}
      perfName='sheet_qibla'
      onPresent={handlePresent}
      stackBehavior='push'>
      {state.status === 'ready' && <QiblaMap here={state.here} bearing={state.qibla} roads={state.roads} />}
      <View style={styles.card}>
        <Text style={styles.reading}>
          {state.status === 'ready' ? qiblaSentence(state.answer) : WITHOUT_A_MAP[state.status]}
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.xxl,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    padding: SPACING.xl,
  },
  reading: {
    color: COLORS.text.secondary,
    fontSize: TEXT.size,
    textAlign: 'center',
  },
});

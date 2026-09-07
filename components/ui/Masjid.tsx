import { useAtomValue } from 'jotai';
import { Image, StyleSheet, View } from 'react-native';

import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

type MasjidProps = {
  width?: number;
  height?: number;
};

// Both platforms render the icon from pre-rasterized PNGs (rsvg output,
// transparent bg, identical art): the 30-path SVG re-walks react-native-svg's
// drawing pipeline on every full-window display-list record — each Android
// page-swipe start paid 40-56ms for it on the SD820 (bisect-verified: icon
// blanked → worst swipe doFrame 56→10ms); iOS pays a vector re-render on
// every draw for the same reason. A bitmap draw is a single cheap op.
const ICON_SOURCES = {
  standard: require('@/assets/icons/png/masjid.png'),
  ramadan: require('@/assets/icons/png/masjid-ramadan.png'),
} as const;

export default function Masjid({ height = 45, width = 45 }: MasjidProps) {
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const useRamadanIcon = isRamadan() && decorationsEnabled;
  const variant = useRamadanIcon ? 'ramadan' : 'standard';
  return (
    <View style={styles.container}>
      <Image source={ICON_SOURCES[variant]} style={[styles.icon, { height, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {},
});

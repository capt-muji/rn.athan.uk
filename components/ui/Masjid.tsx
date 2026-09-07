import { useAtomValue } from 'jotai';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { COLORS, SHADOW } from '@/shared/constants';
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

// Android glow: the exact s13 FeDropShadow spec (canvas 849.4u, gold
// silhouette @0.6 + drop shadow dx/dy 62 σ165 #EF9C29 @0.22) baked to a
// sprite. A bitmap renders identically on EVERY Android — the old
// direct-TSX FeDropShadow approach had to be gated to API ≥ 29 and never ran
// on the 3T; this gives all tiers the same halo. iOS keeps its native
// content-alpha shadow (styles.icon below) as the pixel bar.
const GLOW_SOURCES = {
  standard: require('@/assets/icons/png/decorations/masjid-glow.png'),
  ramadan: require('@/assets/icons/png/decorations/masjid-ramadan-glow.png'),
} as const;

// Matches the old MasjidGlow component's canvas padding
const GLOW_MARGIN = 12;

export default function Masjid({ height = 45, width = 45 }: MasjidProps) {
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const useRamadanIcon = isRamadan() && decorationsEnabled;
  const variant = useRamadanIcon ? 'ramadan' : 'standard';
  const glowCanvas = width + GLOW_MARGIN * 2;
  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <Image
          source={GLOW_SOURCES[variant]}
          style={[styles.glow, { left: -GLOW_MARGIN, top: -GLOW_MARGIN, width: glowCanvas, height: glowCanvas }]}
        />
      )}
      <Image source={ICON_SOURCES[variant]} style={[styles.icon, { height, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    resizeMode: 'stretch',
  },
  icon: {
    shadowColor: COLORS.masjid.glow,
    ...SHADOW.masjid,
  },
});

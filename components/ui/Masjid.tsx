import { useAtomValue } from 'jotai';
import { Platform, StyleSheet, View } from 'react-native';

import Icon from '@/assets/icons/svg/masjid.svg';
import RamadanIcon from '@/assets/icons/svg/masjid-ramadan.svg';
import MasjidGlow, { MASJID_GLOW_MARGIN } from '@/components/ui/masjidGlow';
import MasjidRamadanGlow from '@/components/ui/masjidRamadanGlow';
import { COLORS, SHADOW } from '@/shared/constants';
import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 45, width = 45 }: MasjidProps) {
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const useRamadanIcon = isRamadan() && decorationsEnabled;
  const MasjidIcon = useRamadanIcon ? RamadanIcon : Icon;
  const GlowLayer = useRamadanIcon ? MasjidRamadanGlow : MasjidGlow;
  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <View
          style={[styles.glow, { left: -MASJID_GLOW_MARGIN, top: -MASJID_GLOW_MARGIN }]}
          renderToHardwareTextureAndroid>
          <GlowLayer size={width} />
        </View>
      )}
      <MasjidIcon style={styles.icon} height={height} width={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Android: silhouette-shaped golden glow behind the icon (a View boxShadow
  // renders as a square rect here — iOS gets its native content-alpha glow).
  // renderToHardwareTextureAndroid rasterizes the FeDropShadow ONCE — without
  // it the filter re-rasterizes every parent redraw and froze page swipes for
  // seconds (measured on the S23: 2.3s stalls with it live, zero without)
  glow: {
    position: 'absolute',
  },
  icon: {
    shadowColor: COLORS.masjid.glow,
    ...SHADOW.masjid,
  },
});

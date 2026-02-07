import { useAtomValue } from 'jotai';
import { StyleSheet, View } from 'react-native';

import RamadanIcon from '@/assets/icons/svg/masjid-ramadan.svg';
import Icon from '@/assets/icons/svg/masjid.svg';
import { COLORS, SHADOW } from '@/shared/constants';
import { isRamadan } from '@/shared/time';
import { decorationsEnabledAtom } from '@/stores/ui';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 45, width = 45 }: MasjidProps) {
  const decorationsEnabled = useAtomValue(decorationsEnabledAtom);
  const MasjidIcon = isRamadan() && decorationsEnabled ? RamadanIcon : Icon;
  return (
    <View style={styles.container}>
      <MasjidIcon style={styles.icon} height={height} width={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    shadowColor: COLORS.masjid.glow,
    ...SHADOW.masjid,
  },
});

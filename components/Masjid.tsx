import { StyleSheet, View } from 'react-native';

import Icon from '@/assets/icons/masjid.svg';
import { COLORS, SHADOW } from '@/shared/constants';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 45, width = 45 }: MasjidProps) {
  return (
    <View style={styles.container}>
      <Icon style={styles.icon} height={height} width={width} />
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

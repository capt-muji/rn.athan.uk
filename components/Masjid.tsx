import { StyleSheet, View } from 'react-native';

import Icon from '@/assets/icons/masjid.svg';
import { COLORS, SIZE, SHADOW } from '@/shared/constants';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = SIZE.masjid.height, width = SIZE.masjid.width }: MasjidProps) {
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

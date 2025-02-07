import { StyleSheet } from 'react-native';

import Icon from '@/assets/icons/masjid.svg';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 55, width = 55 }: MasjidProps) {
  return <Icon style={styles.icon} height={height} width={width} />;
}

const styles = StyleSheet.create({
  icon: {
    shadowColor: '#EF9C29',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
});

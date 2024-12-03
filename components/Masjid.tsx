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
    shadowColor: '#009dff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});

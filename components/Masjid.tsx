import { StyleSheet, View } from 'react-native';

import Icon from '@/assets/icons/masjid.svg';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ height = 55, width = 55 }: MasjidProps) {
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
    shadowColor: '#EF9C29',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});

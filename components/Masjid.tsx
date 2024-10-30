import React from 'react';
import { StyleSheet } from 'react-native';

import Icon from '../assets/masjid.svg';

type MasjidProps = {
  width?: number;
  height?: number;
};

export default function Masjid({ width = 55, height = 55 }: MasjidProps) {
  return <Icon style={styles.icon} width={width} height={height} />;
}

const styles = StyleSheet.create({
  icon: {
    shadowColor: '#A620E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

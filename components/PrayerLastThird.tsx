import { View, StyleSheet, Text } from 'react-native';
import Prayer from './Prayer';
import { TEXT, PRAYER, SCREEN, PRAYERS_ENGLISH, COLORS } from '@/shared/constants';

export default function PrayerLastThird() {
  const lastThirdIndex = PRAYERS_ENGLISH.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.text}>Fri, 20th</Text>
        <Text style={styles.text}>8h 32m 28s</Text>
      </View>
      <Prayer index={lastThirdIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SCREEN.paddingHorizontal,
    backgroundColor: '#6941c63f',
    borderColor: '#6941c64a',
    borderWidth: 1,
    ...PRAYER.border,
    ...PRAYER.shadow,
  },
  heading: {
    paddingTop: 15,
    paddingLeft: PRAYER.padding.left,
    paddingRight: PRAYER.padding.right,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontFamily: TEXT.famiy.regular,
    letterSpacing: 0.5,
    fontSize: TEXT.sizeSmaller,
    color: '#a0bcf487',
  },
});
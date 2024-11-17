import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BsArrowClockwise } from "rn-icons/bs";

import { COLORS, TEXT } from '@/constants';
import Masjid from './Masjid';

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text style={[styles.heading]}> SETTINGS PAGE! </Text>
      <Text style={[styles.subtext, styles.first]}> Some random text here. </Text>
      <Text style={[styles.subtext, styles.last]}> Even more random text here! </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 28,
    marginBottom: 18,
    fontFamily: TEXT.famiy.medium
  },
  subtext: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
    fontFamily: TEXT.famiy.regular,
  },
  first: {
    marginBottom: 4
  },
  last: {
    marginBottom: 50
  },
  button: {
    marginTop: 50,
    flexDirection: 'row',
    backgroundColor: COLORS.transparentBlack,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 5,
  },
  icon: {
    marginRight: 10
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BsArrowClockwise } from "rn-icons/bs";

import { COLORS, TEXT } from '@/constants';
import Masjid from './Masjid';

export default function Extras() {
  return (
    <View style={styles.container}>
      <Text style={[styles.heading]}> EXTRAS PAGE! </Text>
      <Text style={[styles.subtext, styles.first]}> Something went wrong. </Text>
      <Text style={[styles.subtext, styles.last]}> We are investigating! </Text>
      <Masjid height={65} width={60} />
      <Pressable style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 1 : 0.75 },
      ]}>
        <BsArrowClockwise style={styles.icon} size={16} color={'white'} />
        <Text style={[styles.subtext]}> Refresh </Text>
      </Pressable>
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

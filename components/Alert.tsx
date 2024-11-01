import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import Tooltip from 'react-native-walkthrough-tooltip';
import { COLORS, TEXT } from '@/constants';

export default function Alert() {
  const [innerTooltipVisible, setInnerTooltipVisible] = useState(false);

  const handleInnerTooltipPress = () => {
    setInnerTooltipVisible((prev) => !prev);
  };

  return (
    // @ts-ignore
    <Tooltip
      isVisible={innerTooltipVisible}
      content={
        <View style={styles.tooltip}>
          <PiBellSimpleRinging style={styles.icon} color={'white'} size={20} />
          <Text style={styles.text}> Notification </Text>
          {/* <Text style={styles.text}> Off </Text> */}
        </View>
      }
      onClose={() => setInnerTooltipVisible(false)}
      // backgroundColor={'black'}
      placement={'left'}
      contentStyle={styles.contentStyle}
    >
      <Pressable onPress={handleInnerTooltipPress} style={styles.iconContainer}>
        <PiBellSimpleRinging color={'white'} size={20} />
      </Pressable>
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 5,
  },
  contentStyle: {
    paddingHorizontal: 35,
    paddingVertical: 20,
    backgroundColor: 'black',
  },
  tooltip: {
    flexDirection: 'row',
    // backgroundColor: 'green',
    // justifyContent: 'center',
    // alignContent: 'center',
    alignItems: 'center'
  },
  icon: {
    marginRight: 15
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size
  }
});

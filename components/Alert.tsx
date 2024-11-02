import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import Tooltip from 'react-native-walkthrough-tooltip';
import { COLORS, TEXT } from '@/constants';
import * as Haptics from 'expo-haptics';

export default function Alert() {
  const [innerTooltipVisible, setInnerTooltipVisible] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  const icons = [PiBellSimpleSlash, PiBellSimpleRinging, PiVibrate, PiSpeakerSimpleHigh];
  const labels = ["Off", "Notification", "Vibrate", "Sound"];
  const IconComponent = icons[iconIndex];
  const labelText = labels[iconIndex];

  const handleInnerTooltipPress = () => {
    // Ensure the tooltip is visible
    if (!innerTooltipVisible) {
      setInnerTooltipVisible(true);
    }

    // Update the icon index and label text
    setIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    // @ts-ignore
    <Tooltip
      isVisible={innerTooltipVisible}
      content={
        <View style={styles.tooltip}>
          <IconComponent style={styles.icon} color={'white'} size={20} />
          <Text style={styles.text}>{labelText}</Text>
        </View>
      }
      onClose={() => setInnerTooltipVisible(false)}
      placement={'left'}
      contentStyle={styles.contentStyle}
    >
      <Pressable onPress={handleInnerTooltipPress} style={styles.iconContainer}>
        <IconComponent color={'white'} size={20} />
      </Pressable>
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  contentStyle: {
    paddingHorizontal: 35,
    paddingVertical: 20,
    backgroundColor: 'black',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 15,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});

import React, { useState, useRef } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Popover from 'react-native-popover-view';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { COLORS, TEXT } from '@/constants';

export default function Alert() {
  const [iconIndex, setIconIndex] = useState(0);
  const [showPopover, setShowPopover] = useState(false);
  const timeoutRef = useRef(null);

  const icons = [PiBellSimpleSlash, PiBellSimpleRinging, PiVibrate, PiSpeakerSimpleHigh];
  const labels = ["Off", "Notification", "Vibrate", "Sound"];
  const IconComponent = icons[iconIndex];

  const handlePress = () => {
    const nextIndex = (iconIndex + 1) % icons.length;
    setIconIndex(nextIndex);
    setShowPopover(true);

    // Clear any existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Hide after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 2000);
  };

  return (
    <Popover
      isVisible={showPopover}
      onRequestClose={() => setShowPopover(false)}
      from={(
        <Pressable onPress={handlePress} style={styles.iconContainer}>
          <IconComponent color="white" size={20} />
        </Pressable>
      )}
      popoverStyle={styles.popover}
      placement="left"
      animationConfig={{
        duration: 200,
        delay: 0
      }}
      arrowSize={{ width: 16, height: 8 }}  // wider width, shorter height
      arrowStyle={{ borderTopColor: 'black' }}
      arrowShift={-2}  // center the arrow
    >
      <View style={styles.popoverContent}>
        <IconComponent color="white" size={20} />
        <Text style={styles.label}>{labels[iconIndex]}</Text>
      </View>
    </Popover>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  popover: {
    backgroundColor: 'black',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  popoverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});

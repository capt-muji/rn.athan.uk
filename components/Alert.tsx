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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update both states together
    setIconIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % icons.length;
      setShowPopover(true);
      return nextIndex;
    });

    timeoutRef.current = setTimeout(() => setShowPopover(false), 2000);
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
        useNativeDriver: true,
        delay: 0
      }}
      backgroundColor="rgba(0, 0, 0, 0.25)"
      arrowSize={{ width: 16, height: 8 }}
      arrowStyle={{ borderTopColor: 'black' }}
      arrowShift={-2}
    >
      {/* Move content into immediate render to avoid any potential delays */}
      <IconComponent color="white" size={20} style={{ marginRight: 10 }} />
      <Text style={styles.label}>{labels[iconIndex]}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Remove popoverContent style and merge into popover
  label: {
    color: COLORS.textPrimary,
    fontSize: TEXT.size,
  },
});

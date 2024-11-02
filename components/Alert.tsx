import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Popover from 'react-native-popover-view';
import { PiVibrate, PiBellSimpleSlash, PiBellSimpleRinging, PiSpeakerSimpleHigh } from "rn-icons/pi";
import { COLORS, TEXT } from '@/constants';

interface AlertConfig {
  icon: typeof PiBellSimpleSlash;
  label: string;
}

export default function Alert() {
  const [iconIndex, setIconIndex] = useState(0);
  const [showPopover, setShowPopover] = useState(false);

  // Memoize alert configurations
  const alertConfigs: AlertConfig[] = useMemo(() => [
    { icon: PiBellSimpleSlash, label: "Off" },
    { icon: PiBellSimpleRinging, label: "Notification" },
    { icon: PiVibrate, label: "Vibrate" },
    { icon: PiSpeakerSimpleHigh, label: "Sound" }
  ], []);

  const handlePress = useCallback(() => {
    setIconIndex(prev => (prev + 1) % alertConfigs.length);
    setShowPopover(true);
    
    // Auto-hide popover after delay
    const timer = setTimeout(() => setShowPopover(false), 2000);
    return () => clearTimeout(timer);
  }, [alertConfigs.length]);

  const currentConfig = alertConfigs[iconIndex];
  const IconComponent = currentConfig.icon;

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
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }} // Add this line to reduce dimming
      arrowSize={{ width: 16, height: 8 }}
      arrowStyle={{ borderTopColor: 'black' }}
      arrowShift={-2}
    >
      <IconComponent color="white" size={20} style={styles.popoverIcon} />
      <Text style={styles.label}>{currentConfig.label}</Text>
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

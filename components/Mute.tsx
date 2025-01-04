import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { TEXT } from '@/shared/constants';

export default function Mute() {
  const [isMuted, setIsMuted] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMuted((prev) => !prev);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Text style={styles.text}>{isMuted ? 'Unmute all' : 'Mute all'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 35,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginTop: 10,
  },
  text: {
    color: '#fff',
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.sizeSmaller,
  },
});

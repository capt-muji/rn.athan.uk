import { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

import { TEXT } from '@/shared/constants';

export default function Mute() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Pressable style={styles.container} onPress={() => setIsMuted((prev) => !prev)}>
      <Text style={styles.text}>{isMuted ? 'Unmute all' : 'Mute all'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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

import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { TEXT } from '@/shared/constants';

export default function Mute() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Pressable
      onPress={() => setIsMuted((prev) => !prev)}
      style={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: '#333',
        alignSelf: 'center',
        marginTop: 10,
      }}>
      <Text
        style={{
          color: '#fff',
          fontFamily: TEXT.family.regular,
          fontSize: TEXT.sizeSmaller,
        }}>
        {isMuted ? 'Unmute all' : 'Mute all'}
      </Text>
    </Pressable>
  );
}

/**
 * A component for the harness's own tests. Like Sheet.tsx, it works out a value from the platform as it loads, and it
 * calls React's own hook, a hook from a mocked library (Reanimated) and one of React Native's, which loads in render
 */

import { useState } from 'react';
import { Platform, Text, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

const LOADED_AS = Platform.select({ ios: 'iOS', android: 'Android' });

export default function PlatformAtLoad() {
  const [label] = useState(LOADED_AS);
  // Called for the React each one runs on, not for what they return
  useSharedValue(0);
  useWindowDimensions();
  return <Text>{label}</Text>;
}

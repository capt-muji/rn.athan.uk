import { Stack } from 'expo-router';
import { COLORS } from '@/constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function Layout() {
  console.log('[Layout] Rendering layout');
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'blue' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          presentation: 'modal',
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: COLORS.gradientStart
          }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="extras"
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            presentation: 'card',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
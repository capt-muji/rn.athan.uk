import { Stack } from 'expo-router';
import { COLORS } from '@/constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        />
        <Stack.Screen
          name="extras"
          options={{
            gestureDirection: 'horizontal',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
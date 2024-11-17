import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from '@/components/Navigation';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
    </GestureHandlerRootView>
  );
}
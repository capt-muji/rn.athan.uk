import { ReactNode } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GradientBackground from '@/components/GradientBackground';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFillObject}>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      {children}
    </GestureHandlerRootView>
  );
}

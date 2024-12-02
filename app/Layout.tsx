import { ReactNode } from 'react';
import { StatusBar } from 'react-native';

import GradientBackground from '@/components/GradientBackground';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <GradientBackground />
      <StatusBar barStyle="light-content" />
      {children}
    </>
  );
}

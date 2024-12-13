import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { AthannotifViewProps } from './Athannotif.types';

const NativeView: React.ComponentType<AthannotifViewProps> =
  requireNativeViewManager('Athannotif');

export default function AthannotifView(props: AthannotifViewProps) {
  return <NativeView {...props} />;
}

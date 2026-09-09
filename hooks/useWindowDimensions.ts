export { useWindowDimensions } from 'react-native';

// RN's live hook (re-renders on real dimension changes). This module
// previously memoized the launch-time size, which froze every
// absolute-geometry consumer (overlay catchers, veil glow) on resizable
// windows. Phones never fire dimension changes, so behavior there is
// identical.

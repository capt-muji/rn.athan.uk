/**
 * Unit tests for hooks/useWindowDimensions.ts
 *
 * The module has no statements of its own: it hands out React Native's live hook, so geometry follows a window that
 * changes size. What it must not become again is a copy of the size at launch, which froze every absolute-geometry
 * consumer on resizable windows.
 */

import { useWindowDimensions } from '../useWindowDimensions';

// Babel hoists jest.mock above imports: factories may only close over `mock`-prefixed bindings
const mockWindow = { size: { width: 390, height: 844, scale: 3, fontScale: 1 } };

jest.mock('react-native', () => ({ useWindowDimensions: () => mockWindow.size }));

describe('useWindowDimensions', () => {
  it('reports the window as it is at each render, not as it was at launch', () => {
    expect(useWindowDimensions()).toEqual({ width: 390, height: 844, scale: 3, fontScale: 1 });

    mockWindow.size = { width: 1024, height: 768, scale: 2, fontScale: 1 };

    expect(useWindowDimensions()).toEqual({ width: 1024, height: 768, scale: 2, fontScale: 1 });
  });
});

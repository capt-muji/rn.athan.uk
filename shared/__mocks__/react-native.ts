// Mock for react-native

// React Native polyfills requestAnimationFrame as a global; the node test
// environment doesn't provide it (used by the deferred widget-push paths)
global.requestAnimationFrame ??= (cb: FrameRequestCallback) =>
  setTimeout(() => cb(performance.now()), 0) as unknown as number;

export const Platform = {
  OS: 'ios',
  select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.ios ?? options.default,
};

// Mock AppState (used by shared/perf.ts background flush)
export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

// Mock Alert with tracking for test assertions
type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

export const Alert = {
  alert: jest.fn((_title: string, _message?: string, buttons?: AlertButton[]) => {
    // Store the buttons for test access
    Alert._lastButtons = buttons;
  }),
  _lastButtons: undefined as AlertButton[] | undefined,
  // Helper to simulate button press in tests
  _pressButton: async (buttonText: string) => {
    const button = Alert._lastButtons?.find((b) => b.text === buttonText);
    if (button?.onPress) {
      await button.onPress();
    }
  },
};

// Mock Linking
export const Linking = {
  openSettings: jest.fn(() => Promise.resolve()),
  sendIntent: jest.fn(() => Promise.resolve()),
};

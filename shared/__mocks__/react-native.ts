// Mock for react-native
export const Platform = {
  OS: 'ios',
  select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.ios ?? options.default,
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

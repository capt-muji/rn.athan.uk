/**
 * The app.json config SDK 58 reads: the Android notification large icon, and the widget entries
 * in the nested ios form (the top-level aliases are deprecated in expo-widgets 58)
 */

const loadAppConfigFresh = () => {
  const holder: { config?: import('expo/config').ExpoConfig } = {};
  jest.isolateModules(() => {
    // app.config.ts strips the expo-widgets plugin unless the flag is on, and a flags test that ran
    // earlier in this worker may have deleted the variable; the config under test is the
    // widgets-enabled one
    const previousFlag = process.env.EXPO_PUBLIC_WIDGETS;
    process.env.EXPO_PUBLIC_WIDGETS = '1';
    try {
      holder.config = require('../../app.config').default;
    } finally {
      if (previousFlag === undefined) {
        delete process.env.EXPO_PUBLIC_WIDGETS;
      } else {
        process.env.EXPO_PUBLIC_WIDGETS = previousFlag;
      }
    }
  });
  return holder.config as import('expo/config').ExpoConfig;
};

const pluginProps = (name: string): Record<string, unknown> => {
  const entry = (loadAppConfigFresh().plugins ?? []).find((plugin) => Array.isArray(plugin) && plugin[0] === name) as
    | [string, Record<string, unknown>]
    | undefined;
  return entry?.[1] ?? {};
};

describe('the expo-notifications plugin config', () => {
  it('declares the Android large icon', () => {
    expect(pluginProps('expo-notifications').largeIcon).toBe('./assets/icons/config/icon-ios.png');
  });
});

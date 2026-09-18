/**
 * The app.json config SDK 58 reads: the widget entries in the nested ios form (the top-level
 * aliases are deprecated in expo-widgets 58)
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
      const loaded = require('../../app.config').default as
        | import('expo/config').ExpoConfig
        | ((ctx: { platform?: string }) => import('expo/config').ExpoConfig);
      holder.config = typeof loaded === 'function' ? loaded({ platform: 'ios' }) : loaded;
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

const nested = (widget: Record<string, unknown>): { supportedFamilies?: unknown } | undefined =>
  widget.ios as { supportedFamilies?: unknown } | undefined;

describe('the expo-widgets plugin config', () => {
  it('carries every widget nested under ios with no deprecated top-level keys', () => {
    const widgets = pluginProps('expo-widgets').widgets as Array<Record<string, unknown>>;
    expect(widgets).not.toHaveLength(0);

    for (const widget of widgets) {
      expect(Array.isArray(nested(widget)?.supportedFamilies)).toBe(true);
      expect(widget.supportedFamilies).toBeUndefined();
      expect(widget.contentMarginsDisabled).toBeUndefined();
    }
  });
});

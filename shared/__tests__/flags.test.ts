/**
 * Unit tests for shared/flags.ts and its app.config.ts mirror
 *
 * - Flag parsing: only the exact string '1' enables; absence, '0', empty,
 *   and typos disable (fail direction: mistakes disable, never enable)
 * - Contract: app.config.ts strips the expo-widgets plugin exactly when
 *   FEATURE_FLAGS.widgets is false, so the JS gate and the native build
 *   can never drift apart
 */

const loadFlagsFresh = () => {
  const holder: { flags?: typeof import('../flags') } = {};
  jest.isolateModules(() => {
    holder.flags = require('../flags');
  });
  return holder.flags as typeof import('../flags');
};

const loadAppConfigFresh = () => {
  const holder: { config?: import('expo/config').ExpoConfig } = {};
  jest.isolateModules(() => {
    holder.config = require('../../app.config').default;
  });
  return holder.config as import('expo/config').ExpoConfig;
};

const pluginNames = (config: import('expo/config').ExpoConfig): string[] =>
  (config.plugins ?? [])
    .map((plugin: unknown) => {
      if (typeof plugin === 'string') return plugin;
      if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
      return null;
    })
    .filter((name: string | null): name is string => name !== null);

const setEnv = (value: string | undefined) => {
  if (value === undefined) {
    delete process.env.EXPO_PUBLIC_WIDGETS;
  } else {
    process.env.EXPO_PUBLIC_WIDGETS = value;
  }
};

afterEach(() => {
  setEnv(undefined);
});

// =============================================================================
// FLAG PARSING
// =============================================================================

describe('FEATURE_FLAGS.widgets parsing', () => {
  it('is disabled when the variable is absent', () => {
    setEnv(undefined);
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(false);
  });

  it('is enabled only for the exact string 1', () => {
    setEnv('1');
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(true);
  });

  it.each(['0', '', 'true', 'yes', '2', 'on'])('is disabled for %p', (value) => {
    setEnv(value);
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(false);
  });
});

// =============================================================================
// app.config.ts CONTRACT
// =============================================================================

describe('app.config widget plugin parity', () => {
  it('strips the expo-widgets plugin when the flag is disabled', () => {
    setEnv(undefined);
    const config = loadAppConfigFresh();
    expect(pluginNames(config)).not.toContain('expo-widgets');
    expect(pluginNames(config)).toContain('expo-notifications');
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(false);
  });

  it('keeps the expo-widgets plugin when the flag is enabled', () => {
    setEnv('1');
    const config = loadAppConfigFresh();
    expect(pluginNames(config)).toContain('expo-widgets');
    expect(loadFlagsFresh().FEATURE_FLAGS.widgets).toBe(true);
  });

  it('leaves the android package untouched without suffix env', () => {
    setEnv(undefined);
    delete process.env.EXPO_ANDROID_SUFFIX;
    const config = loadAppConfigFresh();
    expect(config.android?.package).toBe('com.mugtaba.athan');
    expect(config.name).toBe('Athan');
  });
});

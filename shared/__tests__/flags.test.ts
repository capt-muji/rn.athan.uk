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

const loadAppConfigFresh = (platform?: string): import('expo/config').ExpoConfig => {
  const holder: { config?: import('expo/config').ExpoConfig } = {};
  jest.isolateModules(() => {
    const loaded = require('../../app.config').default as
      | import('expo/config').ExpoConfig
      | ((ctx: { platform?: string }) => import('expo/config').ExpoConfig);
    holder.config = typeof loaded === 'function' ? loaded({ platform }) : loaded;
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

describe('FEATURE_FLAGS.androidWidgets parsing', () => {
  const setAndroidEnv = (value: string | undefined) => {
    if (value === undefined) {
      delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    } else {
      process.env.EXPO_PUBLIC_ANDROID_WIDGETS = value;
    }
  };

  afterEach(() => {
    setAndroidEnv(undefined);
  });

  it('is disabled when the variable is absent', () => {
    setAndroidEnv(undefined);
    expect(loadFlagsFresh().FEATURE_FLAGS.androidWidgets).toBe(false);
  });

  it('is enabled only for the exact string 1', () => {
    setAndroidEnv('1');
    expect(loadFlagsFresh().FEATURE_FLAGS.androidWidgets).toBe(true);
  });

  it.each(['0', '', 'true', 'yes', '2', 'on'])('is disabled for %p', (value) => {
    setAndroidEnv(value);
    expect(loadFlagsFresh().FEATURE_FLAGS.androidWidgets).toBe(false);
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

// =============================================================================
// ANDROID WIDGET PLUGIN RESOLUTION
// =============================================================================

const withCliArgv = (tokens: string[], run: () => void): void => {
  const originalArgv = process.argv;
  process.argv = ['/usr/local/bin/node', 'prebuild', ...tokens];
  try {
    run();
  } finally {
    process.argv = originalArgv;
  }
};

const widgetsPluginEntry = (config: import('expo/config').ExpoConfig): [string, Record<string, unknown>] | null => {
  const entry = (config.plugins ?? []).find(
    (plugin: unknown): plugin is [string, Record<string, unknown>] =>
      Array.isArray(plugin) && typeof plugin[0] === 'string' && plugin[0] === 'expo-widgets'
  );
  return entry ?? null;
};

describe('app config android widget resolution', () => {
  const setAndroidEnv = (value: string | undefined) => {
    if (value === undefined) {
      delete process.env.EXPO_PUBLIC_ANDROID_WIDGETS;
    } else {
      process.env.EXPO_PUBLIC_ANDROID_WIDGETS = value;
    }
  };

  afterEach(() => {
    setAndroidEnv(undefined);
    delete process.env.EXPO_WIDGETS_ANDROID;
  });

  it('enables expo-widgets android codegen when the android flag is on', () => {
    setAndroidEnv('1');
    let config!: import('expo/config').ExpoConfig;
    withCliArgv(['android'], () => {
      config = loadAppConfigFresh('android');
    });
    const entry = widgetsPluginEntry(config);
    expect(entry).not.toBeNull();
    expect(entry?.[1].enableAndroid).toBe(true);
    expect(config.ios).toBeUndefined();
    expect(pluginNames(config)).toContain('./plugins/androidWidgetAssets');
    expect(pluginNames(config)).toContain('./plugins/androidWidgetGrid');
    // Dangerous mods run last-registered-first: the strip must sit BEFORE
    // expo-widgets so it executes after the provider XMLs are written
    expect(pluginNames(config).indexOf('./plugins/androidWidgetGrid')).toBeLessThan(
      pluginNames(config).indexOf('expo-widgets')
    );

    const widgets = (entry?.[1].widgets as Array<Record<string, unknown>>) ?? [];
    const home = widgets.filter((widget) => widget.android != null);
    const locks = widgets.filter((widget) => widget.name === 'PrayerLockWidget' || widget.name === 'ExtrasLockWidget');
    expect(home).toHaveLength(8);
    expect(home.map((widget) => widget.name).sort()).toEqual(
      [
        'ExtrasWidget',
        'ExtrasWidgetDark',
        'ExtrasWidgetDarkMedium',
        'ExtrasWidgetMedium',
        'PrayerWidget',
        'PrayerWidgetDark',
        'PrayerWidgetDarkMedium',
        'PrayerWidgetMedium',
      ].sort()
    );
    for (const widget of home) {
      const android = widget.android as Record<string, unknown>;
      // Grid-agnostic sizing (owner ruling 2026-09-19): minWidth arithmetic is
      // the only lever, so no targetCell keys exist. Horizontal-only resize
      // (owner ruling 2026-09-19): 50% to 100% morphs the composition, no
      // vertical resizing.
      expect(android.resizeMode).toBe('horizontal');
      expect(android.initialLayout).toBe('./widgets/PrayerWidget');
      expect(android.minWidth).toBe(/Medium/.test(String(widget.name)) ? 310 : 160);
      expect(android.minHeight).toBe(110);
      expect(android.targetCellWidth).toBeUndefined();
      expect(android.targetCellHeight).toBeUndefined();
    }
    for (const lock of locks) {
      expect(lock.android).toBeNull();
    }
  });

  it('strips expo-widgets on the android resolution when the android flag is off', () => {
    setAndroidEnv(undefined);
    let config!: import('expo/config').ExpoConfig;
    withCliArgv(['android'], () => {
      config = loadAppConfigFresh('android');
    });
    expect(pluginNames(config)).not.toContain('expo-widgets');
  });

  it('treats EXPO_WIDGETS_ANDROID as a platform signal, gated by the flag', () => {
    setAndroidEnv('1');
    process.env.EXPO_WIDGETS_ANDROID = '1';
    let forcedAndroid!: import('expo/config').ExpoConfig;
    withCliArgv([], () => {
      forcedAndroid = loadAppConfigFresh(undefined);
    });
    expect(pluginNames(forcedAndroid)).toContain('expo-widgets');
    expect(forcedAndroid.ios).toBeUndefined();

    setAndroidEnv(undefined);
    let flagStillGates!: import('expo/config').ExpoConfig;
    withCliArgv([], () => {
      flagStillGates = loadAppConfigFresh(undefined);
    });
    expect(pluginNames(flagStillGates)).not.toContain('expo-widgets');
  });

  it('keeps the ios resolution ruled by the ios flag only', () => {
    setAndroidEnv('1');
    setEnv(undefined);
    let flagOff!: import('expo/config').ExpoConfig;
    withCliArgv(['ios'], () => {
      flagOff = loadAppConfigFresh('ios');
    });
    expect(pluginNames(flagOff)).not.toContain('expo-widgets');

    setEnv('1');
    let flagOn!: import('expo/config').ExpoConfig;
    withCliArgv(['ios'], () => {
      flagOn = loadAppConfigFresh('ios');
    });
    const entry = widgetsPluginEntry(flagOn);
    expect(entry).not.toBeNull();
    expect(entry?.[1].enableAndroid).toBeUndefined();
    expect(flagOn.ios?.bundleIdentifier).toBe('com.mugtaba.athan');
  });
});

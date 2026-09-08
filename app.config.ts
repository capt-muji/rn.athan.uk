import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const config = appJson.expo as ExpoConfig;

// Campaign builds set EXPO_ANDROID_SUFFIX in the eas.json profile env so the test
// artifact installs beside the Play Store app (signatures differ; install -r is impossible).
// Without the env var this config is byte-identical to app.json.
const androidSuffix = process.env.EXPO_ANDROID_SUFFIX;
const nameSuffix = process.env.EXPO_NAME_SUFFIX ?? 'BGTest';

if (androidSuffix && config.android?.package) {
  config.android.package = `${config.android.package}.${androidSuffix}`;
  config.name = `${config.name} ${nameSuffix}`;
}

// Feature-flag mirror of shared/flags.ts (importing TS files here would need
// tsx; shared/__tests__/flags.test.ts pins the two in lockstep). Stripping
// the plugin removes the widget extension from the native build entirely.
const widgetsEnabled = process.env.EXPO_PUBLIC_WIDGETS === '1';
const pluginName = (plugin: unknown): string | null => {
  if (typeof plugin === 'string') return plugin;
  if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
  return null;
};

if (!widgetsEnabled) {
  config.plugins = (config.plugins ?? []).filter((plugin) => pluginName(plugin) !== 'expo-widgets');
}

export default config;

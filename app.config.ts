import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const config = appJson.expo as ExpoConfig;

// EXPO_ANDROID_SUFFIX suffixes the Android package so a test artifact installs beside the Play
// Store app (signatures differ; install -r is impossible). It arrives from the build environment
// and nothing committed sets it: local device builds pass it inline on the prebuild and run
// commands (the rituals in ai/AGENTS.md), and the one EAS campaign that used it added a temporary
// env entry to the preview profile which was never committed. No eas.json profile carries it, so
// absence is the normal case — without the variable this config is byte-identical to app.json.
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
const androidWidgetsEnabled = process.env.EXPO_PUBLIC_ANDROID_WIDGETS === '1';
const pluginName = (plugin: unknown): string | null => {
  if (typeof plugin === 'string') return plugin;
  if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
  return null;
};

// Android widgets ride their own flag. An android-only config resolution
// (this CLI never passes ctx.platform, so the platform comes from the
// normalized CLI argv — 'expo prebuild -p android' evaluates this file with
// argv ['prebuild', 'android'] — or the EXPO_WIDGETS_ANDROID env override
// for non-CLI resolvers) keeps the expo-widgets plugin with its Android
// code generation on, and drops config.ios with it: the plugin's iOS side
// would otherwise generate a widget extension whenever ios.bundleIdentifier
// exists, and an android-only build never reads ios config.
const argvTokens = process.argv.map((token) => token.replace(/^--?platform=?/i, '').toLowerCase());
const androidOnlyResolution =
  (argvTokens.includes('android') && !argvTokens.includes('ios')) || process.env.EXPO_WIDGETS_ANDROID === '1';

const enableAndroidWidgets = (expoConfig: ExpoConfig): ExpoConfig => {
  expoConfig.ios = undefined;
  expoConfig.plugins = (expoConfig.plugins ?? []).map((plugin) => {
    if (pluginName(plugin) !== 'expo-widgets') return plugin;
    const [, props] = plugin as [string, Record<string, unknown>];
    return ['expo-widgets', { ...props, enableAndroid: true }];
  });
  expoConfig.plugins = [...(expoConfig.plugins ?? []), './plugins/androidWidgetAssets'];
  return expoConfig;
};

const stripWidgetsPlugin = (expoConfig: ExpoConfig): ExpoConfig => {
  expoConfig.plugins = (expoConfig.plugins ?? []).filter((plugin) => pluginName(plugin) !== 'expo-widgets');
  return expoConfig;
};

const resolveConfig = ({ platform }: { platform?: string }): ExpoConfig => {
  if (platform === 'android' || (platform === undefined && androidOnlyResolution && androidWidgetsEnabled)) {
    if (androidWidgetsEnabled) return enableAndroidWidgets(config);
    return stripWidgetsPlugin(config);
  }
  if (!widgetsEnabled) return stripWidgetsPlugin(config);
  return config;
};

// The build contract: EXPO_PUBLIC_ENV and EXPO_PUBLIC_API_KEY reach a release build from the
// EAS dashboard environment, so nothing in a checkout proves they arrived. Neither failure is
// visible afterwards — shared/config.ts types apiKey as `string | undefined` and api/client.ts
// interpolates it straight into the times URL, so an absent key ships as the literal
// "key=undefined", and tsc accepts it. Fail the build here rather than at a user's first sync.
//
// Guarded for prod and preview only: local and development builds are meant to run on the
// .env.example placeholder and mocks/simple.ts. Jest is exempt because shared/__tests__/
// flags.test.ts loads this file, and a jest worker's process.env is shared across suites —
// several set EXPO_PUBLIC_ENV to 'prod' without restoring it, so an unrelated suite would
// otherwise trip the guard. Keyed off JEST_WORKER_ID, not NODE_ENV, which constants.test.ts
// reassigns mid-run.
const PLACEHOLDER_API_KEY = 'key'; // .env.example's stand-in value
const buildEnv = process.env.EXPO_PUBLIC_ENV;
const apiKey = process.env.EXPO_PUBLIC_API_KEY;
const contractApplies = (buildEnv === 'prod' || buildEnv === 'preview') && process.env.JEST_WORKER_ID === undefined;

if (contractApplies && (!apiKey || apiKey === PLACEHOLDER_API_KEY)) {
  const reason = apiKey ? 'is still the .env.example placeholder' : 'is missing';
  throw new Error(
    `EXPO_PUBLIC_API_KEY ${reason} while EXPO_PUBLIC_ENV=${buildEnv}. ` +
      'The preview and production profiles take it from the EAS dashboard environment; set it ' +
      'there, or pass it inline for a local prod/preview build. Building on would ship prayer ' +
      'times fetched with key=undefined.'
  );
}

export default resolveConfig;

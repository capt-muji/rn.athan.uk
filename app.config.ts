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

export default config;

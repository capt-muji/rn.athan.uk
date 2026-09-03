import type { ExpoConfig } from 'expo/config';

import appJson from './app.json';

const config = appJson.expo as ExpoConfig;

// Campaign builds set EXPO_ANDROID_SUFFIX in the eas.json profile env so the test
// artifact installs beside the Play Store app (signatures differ; install -r is impossible).
// Without the env var this config is byte-identical to app.json.
const androidSuffix = process.env.EXPO_ANDROID_SUFFIX;

if (androidSuffix && config.android?.package) {
  config.android.package = `${config.android.package}.${androidSuffix}`;
  config.name = `${config.name} BGTest`;
}

export default config;

const fs = require('node:fs');
const path = require('node:path');

/**
 * Writes Android's per-app language-picker manifest (locales_config.xml)
 * and points the application tag at it. The six locales derive from
 * expo.locales plus en, so the declaration can never drift from the
 * strings actually shipped (D43, D46).
 */
const buildLocalesConfigXml = (locales) => {
  const entries = locales.map((locale) => `  <locale android:name="${locale}"/>`).join('\n');
  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">\n' +
    `${entries}\n` +
    '</locale-config>\n'
  );
};

const withAndroidLocaleConfig = (config) => {
  const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

  const withManifest = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$ = { ...application.$, 'android:localeConfig': '@xml/locales_config' };
    }
    return modConfig;
  });

  return withDangerousMod(withManifest, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const locales = ['en', ...Object.keys(config.locales ?? {})];
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'locales_config.xml'), buildLocalesConfigXml(locales));
      return modConfig;
    },
  ]);
};

module.exports = withAndroidLocaleConfig;
module.exports.buildLocalesConfigXml = buildLocalesConfigXml;

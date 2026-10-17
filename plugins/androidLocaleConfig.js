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

/** snake_case of a widget kind name, the resource-name derivation (digits split off) */
const widgetResourceName = (kind) =>
  kind
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z])([0-9])/g, '$1_$2')
    .toLowerCase();

const expoWidgetsResolvesWidgetDefaults = (config) =>
  (config.plugins ?? []).some((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets');

/**
 * The default-locale twins of the translated strings: the two permission strings and the
 * two gallery keys of every iOS-only widget kind. A translated key with no counterpart in
 * values/ fails lintVitalRelease (ExtraTranslation), which gates every release build, and
 * the android resolution drops config.ios, so the en permission bytes and the widget kinds
 * are read from the committed app.json. Android kinds are skipped only when expo-widgets is
 * in the resolved plugins: it writes their defaults, and with it stripped (widgets off)
 * every kind twins here or the translated keys fail lintVitalRelease.
 */
const defaultLocaleStringEntries = (projectRoot, config) => {
  // readFileSync, not require: the mod compiler evaluates this file in a sandbox whose
  // require does not resolve dynamic absolute paths the way plain node does
  const appExpo = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8')).expo;
  const infoPlist = appExpo.ios.infoPlist;
  const widgetsEntry = (appExpo.plugins ?? []).find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets');
  const widgets = widgetsEntry ? widgetsEntry[1].widgets : [];
  const entries = [
    ['NSLocationWhenInUseUsageDescription', infoPlist.NSLocationWhenInUseUsageDescription],
    ['NSUserNotificationsUsageDescription', infoPlist.NSUserNotificationsUsageDescription],
  ];
  for (const widget of widgets) {
    // expo-widgets writes the android kinds' defaults itself; a twin here would
    // be a duplicate resource. With the plugin stripped from the resolution
    // (widgets off) nobody else writes them, so every kind twins
    if (widget.android && expoWidgetsResolvesWidgetDefaults(config)) continue;
    entries.push([`${widgetResourceName(widget.name)}_display_name`, widget.displayName]);
    entries.push([`${widgetResourceName(widget.name)}_description`, widget.description]);
  }
  return entries;
};

/** Same quoted-value shape the stock Locales writer emits, so the folder reads uniformly */
const buildDefaultLocaleStringsXml = (entries) =>
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<resources>\n' +
  entries.map(([name, value]) => `  <string name="${name}">"${value}"</string>`).join('\n') +
  '\n</resources>\n';

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
      const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
      const locales = ['en', ...Object.keys(config.locales ?? {})];
      fs.mkdirSync(path.join(resDir, 'xml'), { recursive: true });
      fs.writeFileSync(path.join(resDir, 'xml', 'locales_config.xml'), buildLocalesConfigXml(locales));
      // A file of our own, not a rewrite of expo-widgets' strings.xml: mods run
      // last-registered-first, so ours executes before theirs and an append would be lost
      const defaults = defaultLocaleStringEntries(projectRoot, config);
      fs.mkdirSync(path.join(resDir, 'values'), { recursive: true });
      fs.writeFileSync(path.join(resDir, 'values', 'locales_defaults.xml'), buildDefaultLocaleStringsXml(defaults));
      return modConfig;
    },
  ]);
};

module.exports = withAndroidLocaleConfig;
module.exports.buildLocalesConfigXml = buildLocalesConfigXml;
module.exports.defaultLocaleStringEntries = defaultLocaleStringEntries;
module.exports.buildDefaultLocaleStringsXml = buildDefaultLocaleStringsXml;

const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Java resources measured dead in the shipped APK, excluded by pattern. The commons-codec
 * entry is Beider-Morse phonetic data under org/apache/commons/codec/language/bm/** that only
 * org.apache.commons.codec.language.bm classes read, and R8 strips those classes from both dex
 * files (expo-file-system, whose build.gradle declares the api dependency, uses
 * android.util.Base64 and its own hex in source): measured 131,145 bytes off the stored APK.
 * The root-level leftovers are dependency metadata nothing reads at runtime: 4,783 compressed
 * bytes together. The patterns stay this narrow on purpose — a future dependency reading
 * org/apache/** java resources fails at classload with a missing-resource exception, never
 * silently.
 */
const JAVA_RESOURCE_EXCLUDES = [
  'org/apache/commons/codec/**',
  '/*.properties',
  '/*.proto',
  '/DebugProbesKt.bin',
  '/kotlin-tooling-metadata.json',
];

const EXCLUDES_BLOCK = `        resources {
            excludes += [${JAVA_RESOURCE_EXCLUDES.map((pattern) => `'${pattern}'`).join(', ')}]
        }
`;

const ANCHOR = 'packagingOptions {';
// Plugin-specific: one of our own patterns. A generic `excludes += [` marker would let a
// future template's own excludes line silence this plugin; ours never appears by accident
const MARKER = "'org/apache/commons/codec/**'";

/** Joins the excludes into the template's packagingOptions section inside the android block */
const applyPackagingExcludes = (modResults) => {
  if (modResults.includes(MARKER)) return modResults;

  const anchorAt = modResults.indexOf(ANCHOR);
  if (anchorAt === -1) {
    throw new Error(
      'androidPackagingExcludes: the generated app build.gradle has no packagingOptions section for the java-resource excludes; the Expo template changed shape'
    );
  }

  return `${modResults.slice(0, anchorAt + ANCHOR.length)}\n${EXCLUDES_BLOCK}${modResults.slice(anchorAt + ANCHOR.length)}`;
};

const withAndroidPackagingExcludes = (config) => {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = applyPackagingExcludes(config.modResults.contents);
    return config;
  });
};

module.exports = withAndroidPackagingExcludes;
module.exports.JAVA_RESOURCE_EXCLUDES = JAVA_RESOURCE_EXCLUDES;
module.exports.applyPackagingExcludes = applyPackagingExcludes;

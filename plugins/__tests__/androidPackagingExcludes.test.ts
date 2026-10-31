/**
 * The java-resource excludes that strip the APK's measured-dead dependency data (T-491 step 6):
 * commons-codec's Beider-Morse phonetic tables under org/apache/commons/codec/** (measured
 * 131,145 bytes off the stored APK, read only by language.bm classes R8 strips from both dex
 * files) plus the
 * root-level dependency leftovers (/*.properties, /*.proto, DebugProbesKt.bin,
 * kotlin-tooling-metadata.json, 4,783 compressed bytes together). The fixtures mirror the
 * app build.gradle Expo's template generates, whose android block carries a packagingOptions
 * section the excludes join (plugins/androidPackagingExcludes.js)
 */

import { readFileSync } from 'node:fs';

interface GradleConfigFixture {
  modResults: { contents: string };
}

/** withAppBuildGradle as this SDK runs it: the callback receives modResults as a FileInfo */
jest.mock('expo/config-plugins', () => ({
  withAppBuildGradle: (config: GradleConfigFixture, callback: (config: GradleConfigFixture) => GradleConfigFixture) =>
    callback(config),
}));

const plugin = require('../androidPackagingExcludes') as ((config: GradleConfigFixture) => GradleConfigFixture) & {
  JAVA_RESOURCE_EXCLUDES: string[];
  applyPackagingExcludes: (contents: string) => string;
};
const { applyPackagingExcludes, JAVA_RESOURCE_EXCLUDES } = plugin;

/** The android block's packaging section as Expo's template writes it, jniLibs and all */
const templateGradle = (): string => `apply plugin: "com.android.application"

android {
    compileSdkVersion safeExtGet("compileSdkVersion", 36)

    defaultConfig {
        applicationId "com.example.athan"
    }

    packagingOptions {
        jniLibs {
            def enableLegacyPackaging = findProperty('expo.useLegacyPackaging') ?: 'false'
            useLegacyPackaging enableLegacyPackaging.toBoolean()
        }
    }
}
`;

describe('the java-resource excludes on the app build.gradle', () => {
  it('excludes exactly the two measured-dead groups, commons-codec data and root leftovers', () => {
    expect(JAVA_RESOURCE_EXCLUDES).toEqual([
      'org/apache/commons/codec/**',
      '/*.properties',
      '/*.proto',
      '/DebugProbesKt.bin',
      '/kotlin-tooling-metadata.json',
    ]);
  });

  it('joins the excludes into the template packagingOptions section', () => {
    const out = applyPackagingExcludes(templateGradle());

    expect(out).toContain(
      `packagingOptions {
        resources {
            excludes += ['org/apache/commons/codec/**', '/*.properties', '/*.proto', '/DebugProbesKt.bin', '/kotlin-tooling-metadata.json']
        }`
    );
    // The template's own jniLibs section survives inside the same block
    expect(out).toContain('useLegacyPackaging enableLegacyPackaging.toBoolean()');
  });

  it('applies once, never twice', () => {
    expect(applyPackagingExcludes(applyPackagingExcludes(templateGradle()))).toBe(
      applyPackagingExcludes(templateGradle())
    );
  });

  it('fails loudly when the template no longer carries a packagingOptions section', () => {
    const withoutAnchor = templateGradle().replace('packagingOptions {', 'packaging {');

    expect(() => applyPackagingExcludes(withoutAnchor)).toThrow(/packagingOptions/);
  });

  it('writes the excludes through the gradle file info the SDK hands the plugin', () => {
    const config = plugin({ modResults: { contents: templateGradle() } });

    expect(config.modResults.contents).toContain('excludes += [');
  });

  it('still applies beside a template that grows its own excludes line, where a generic marker would read as already-applied', () => {
    const ownExcludes = templateGradle().replace(
      'packagingOptions {',
      "packagingOptions {\n            resources {\n                excludes += ['META-INF/AL2.0', 'META-INF/LGPL2.1']\n            }"
    );

    const applied = applyPackagingExcludes(ownExcludes);

    expect(applied).toContain("'org/apache/commons/codec/**'");
    expect(applied).toContain('META-INF/AL2.0');
  });

  it('is idempotent on its own applied output', () => {
    const once = applyPackagingExcludes(templateGradle());

    expect(applyPackagingExcludes(once)).toBe(once);
  });
});

describe('the app.json wiring', () => {
  it('registers the plugin, without which the excludes never reach the build', () => {
    const names = (JSON.parse(readFileSync('app.json', 'utf8')).expo.plugins as unknown[]).map((entry) =>
      Array.isArray(entry) ? entry[0] : entry
    );

    expect(names).toContain('./plugins/androidPackagingExcludes');
  });
});

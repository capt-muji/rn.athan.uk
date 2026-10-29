/**
 * The Release pin that makes the widget extension build like the app: expo-widgets' own config
 * plugin writes the target's build settings itself and pins SWIFT_OPTIMIZATION_LEVEL=-Onone for
 * BOTH configurations while leaving ENABLE_DEBUG_DYLIB to default YES for the target, so the
 * shipped Release app carried a debug-dylib extension (an 8.8 MB debug dylib, a __preview.dylib
 * and a 92 KB stub inside PlugIns/ExpoWidgetsTarget.appex, measured on 2.38.4). The fixtures
 * mirror the xcode library's parse output, the only shape the surgery reads
 * (plugins/iosReleaseSettings.js)
 */

const { readFileSync } = require('node:fs');

/** One XCBuildConfiguration entry as the xcode library parses it */
interface ConfigurationEntryFixture {
  isa: 'XCBuildConfiguration';
  name: string;
  buildSettings: Record<string, string>;
}

/** One of the { value, comment } pairs a configuration list names its entries by */
interface ConfigurationRefFixture {
  value: string;
  comment: string;
}

/** One target's XCConfigurationList as the xcode library parses it */
interface ConfigurationListFixture {
  isa: 'XCConfigurationList';
  buildConfigurations: ConfigurationRefFixture[];
  defaultConfigurationName: string;
}

/** The three reads the surgery makes on a parsed project, over fixture maps */
interface ProjectFixture {
  pbxTargetByName: (name: string) => { buildConfigurationList: string } | undefined;
  pbxXCConfigurationList: () => Record<string, ConfigurationListFixture>;
  pbxXCBuildConfigurationSection: () => Record<string, ConfigurationEntryFixture>;
}

const plugin = require('../iosReleaseSettings') as ((config: unknown) => unknown) & {
  WIDGET_TARGET_NAME: string;
  RELEASE_BUILD_SETTINGS: Record<string, string>;
  pinReleaseBuildSettings: (
    configurationList: ConfigurationListFixture,
    buildConfigurationSection: Record<string, ConfigurationEntryFixture>,
    settings: Record<string, string>
  ) => ConfigurationEntryFixture;
  pinWidgetTargetRelease: (xcodeProject: ProjectFixture) => ConfigurationEntryFixture;
  pinModResults: <C extends { modResults: ProjectFixture }>(config: C) => C;
};
const { pinReleaseBuildSettings, pinWidgetTargetRelease, pinModResults } = plugin;

const TARGET = 'ExpoWidgetsTarget';
const RELEASE_UUID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const DEBUG_UUID = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const LIST_UUID = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';

/** The section exactly as expo-widgets leaves it: -Onone pinned on BOTH configurations, and no
 * debug-dylib key anywhere, which is what let the Release default resolve YES */
const sectionFixture = (): Record<string, ConfigurationEntryFixture> => ({
  [RELEASE_UUID]: {
    isa: 'XCBuildConfiguration',
    name: 'Release',
    buildSettings: {
      PRODUCT_NAME: '"$(TARGET_NAME)"',
      SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
    },
  },
  [DEBUG_UUID]: {
    isa: 'XCBuildConfiguration',
    name: 'Debug',
    buildSettings: {
      PRODUCT_NAME: '"$(TARGET_NAME)"',
      SWIFT_OPTIMIZATION_LEVEL: '"-Onone"',
    },
  },
});

const listFixture = (refs: ConfigurationRefFixture[]): ConfigurationListFixture => ({
  isa: 'XCConfigurationList',
  buildConfigurations: refs,
  defaultConfigurationName: 'Release',
});

const releaseAndDebug = (): ConfigurationRefFixture[] => [
  { value: RELEASE_UUID, comment: 'Release' },
  { value: DEBUG_UUID, comment: 'Debug' },
];

const projectFixture = (
  overrides: { withoutTarget?: boolean; withoutList?: boolean; listNamesNoRelease?: boolean } = {}
) => {
  const buildConfigurations = sectionFixture();
  const configurationLists: Record<string, ConfigurationListFixture> = {};
  if (!overrides.withoutList) {
    configurationLists[LIST_UUID] = {
      isa: 'XCConfigurationList',
      buildConfigurations: overrides.listNamesNoRelease ? [{ value: DEBUG_UUID, comment: 'Debug' }] : releaseAndDebug(),
      defaultConfigurationName: 'Release',
    };
  }
  const target = overrides.withoutTarget
    ? undefined
    : { isa: 'PBXNativeTarget', name: TARGET, buildConfigurationList: LIST_UUID, buildPhases: [] };
  return {
    pbxTargetByName: (name: string) => (name === TARGET ? target : undefined),
    pbxXCConfigurationList: () => configurationLists,
    pbxXCBuildConfigurationSection: () => buildConfigurations,
  } satisfies ProjectFixture;
};

describe('the Release settings surgery', () => {
  it('pins ENABLE_DEBUG_DYLIB="NO" and SWIFT_OPTIMIZATION_LEVEL="-O" over the -Onone expo-widgets wrote', () => {
    const section = sectionFixture();

    pinReleaseBuildSettings(listFixture(releaseAndDebug()), section, plugin.RELEASE_BUILD_SETTINGS);

    expect(section[RELEASE_UUID].buildSettings.ENABLE_DEBUG_DYLIB).toBe('"NO"');
    expect(section[RELEASE_UUID].buildSettings.SWIFT_OPTIMIZATION_LEVEL).toBe('"-O"');
  });

  it('returns the section own entry, so the pbxproj writer serializes the pinned settings', () => {
    const section = sectionFixture();

    const pinned = pinReleaseBuildSettings(
      listFixture([{ value: RELEASE_UUID, comment: 'Release' }]),
      section,
      plugin.RELEASE_BUILD_SETTINGS
    );

    expect(pinned).toBe(section[RELEASE_UUID]);
  });

  it('leaves every other setting the entry carried in place', () => {
    const section = sectionFixture();

    pinReleaseBuildSettings(
      listFixture([{ value: RELEASE_UUID, comment: 'Release' }]),
      section,
      plugin.RELEASE_BUILD_SETTINGS
    );

    expect(section[RELEASE_UUID].buildSettings.PRODUCT_NAME).toBe('"$(TARGET_NAME)"');
  });

  it('leaves the Debug configuration exactly as expo-widgets wrote it', () => {
    const section = sectionFixture();

    pinReleaseBuildSettings(listFixture(releaseAndDebug()), section, plugin.RELEASE_BUILD_SETTINGS);

    expect(section[DEBUG_UUID].buildSettings.SWIFT_OPTIMIZATION_LEVEL).toBe('"-Onone"');
    expect(section[DEBUG_UUID].buildSettings.ENABLE_DEBUG_DYLIB).toBeUndefined();
  });

  it('throws when the list names no Release configuration', () => {
    expect(() =>
      pinReleaseBuildSettings(
        listFixture([{ value: DEBUG_UUID, comment: 'Debug' }]),
        sectionFixture(),
        plugin.RELEASE_BUILD_SETTINGS
      )
    ).toThrow(/no Release configuration/);
  });
});

describe('the target guard', () => {
  it('throws naming the target when the project carries none, instead of silently passing', () => {
    // A future expo-widgets rewrite that renames its target would otherwise prebuild green and
    // ship the debug extension again
    expect(() => pinWidgetTargetRelease(projectFixture({ withoutTarget: true }))).toThrow(/ExpoWidgetsTarget/);
  });

  it('throws when the target has no configuration list in the project', () => {
    expect(() => pinWidgetTargetRelease(projectFixture({ withoutList: true }))).toThrow(/ExpoWidgetsTarget/);
  });

  it('throws when the target configuration list names no Release configuration', () => {
    expect(() => pinWidgetTargetRelease(projectFixture({ listNamesNoRelease: true }))).toThrow(
      /no Release configuration/
    );
  });

  it('pins the Release entry of the target own configuration list', () => {
    const project = projectFixture();

    pinWidgetTargetRelease(project);

    const section = project.pbxXCBuildConfigurationSection();
    expect(section[RELEASE_UUID].buildSettings.ENABLE_DEBUG_DYLIB).toBe('"NO"');
    expect(section[RELEASE_UUID].buildSettings.SWIFT_OPTIMIZATION_LEVEL).toBe('"-O"');
    expect(section[DEBUG_UUID].buildSettings.SWIFT_OPTIMIZATION_LEVEL).toBe('"-Onone"');
  });
});

describe('the mod wiring', () => {
  it('pins the xcodeProject mod results in place and returns the config', () => {
    const config = { modResults: projectFixture() };

    const returned = pinModResults(config);

    expect(returned).toBe(config);
    expect(config.modResults.pbxXCBuildConfigurationSection()[RELEASE_UUID].buildSettings.ENABLE_DEBUG_DYLIB).toBe(
      '"NO"'
    );
  });

  it('registers an ios xcodeProject mod on a bare config', () => {
    // withXcodeProject is the same mod expo-widgets creates its target through
    const config = plugin({}) as { mods?: { ios?: Record<string, unknown> } };

    expect(config.mods?.ios?.xcodeproj).toBeDefined();
  });
});

describe('the app.json wiring', () => {
  it('registers the plugin before expo-widgets, whose created target it pins', () => {
    // This SDK runs a mod slot's actions in reverse registration order (the later registration
    // wraps the earlier as its nextMod), so BEFORE in app.json is what runs the pin after the
    // target exists; registered after, prebuild fails the missing-target guard - measured on the
    // generated tree both ways
    const names = (JSON.parse(readFileSync('app.json', 'utf8')).expo.plugins as unknown[]).map((entry) =>
      Array.isArray(entry) ? entry[0] : entry
    ) as string[];

    expect(names).toContain('expo-widgets');
    expect(names).toContain('./plugins/iosReleaseSettings');
    expect(names.indexOf('./plugins/iosReleaseSettings')).toBeLessThan(names.indexOf('expo-widgets'));
  });
});

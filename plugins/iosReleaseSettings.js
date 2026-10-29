const { withXcodeProject } = require('expo/config-plugins');

// expo-widgets' own config plugin writes its target's build settings itself and pins
// SWIFT_OPTIMIZATION_LEVEL="-Onone" for BOTH Debug and Release while leaving ENABLE_DEBUG_DYLIB
// unset, which defaults YES for that target alone (addXCConfigurationList.js; every other target
// in the generated tree resolves NO). The shipped Release app therefore carried an extension
// built from debug content: an 8.8 MB ExpoWidgetsTarget.debug.dylib, a __preview.dylib and a
// 92 KB stub executable inside PlugIns/ExpoWidgetsTarget.appex (measured on 2.38.4). This plugin
// pins the target's Release configuration; Debug keeps exactly what expo-widgets wrote.
const WIDGET_TARGET_NAME = 'ExpoWidgetsTarget';

// Quoted the way every value in the generated entry already rides, so the pbxproj writer
// serializes them verbatim
const RELEASE_BUILD_SETTINGS = {
  ENABLE_DEBUG_DYLIB: '"NO"',
  SWIFT_OPTIMIZATION_LEVEL: '"-O"',
};

// The xcode library names a list's build configurations as { value, comment } pairs over the
// entries the section holds, so the walk resolves uuids through both maps
const pinReleaseBuildSettings = (configurationList, buildConfigurationSection, settings) => {
  for (const { value: uuid } of configurationList.buildConfigurations) {
    const entry = buildConfigurationSection[uuid];
    if (entry?.name !== 'Release') continue;
    Object.assign(entry.buildSettings, settings);
    return entry;
  }
  throw new Error(
    `iosReleaseSettings: the build configuration list for "${WIDGET_TARGET_NAME}" carries no Release configuration`
  );
};

const pinWidgetTargetRelease = (xcodeProject) => {
  const target = xcodeProject.pbxTargetByName(WIDGET_TARGET_NAME);
  if (!target) {
    throw new Error(
      `iosReleaseSettings: the native target "${WIDGET_TARGET_NAME}" is missing from the Xcode project; ` +
        'expo-widgets should have created it - is "./plugins/iosReleaseSettings" registered before "expo-widgets" in app.json?'
    );
  }
  const configurationList = xcodeProject.pbxXCConfigurationList()[target.buildConfigurationList];
  if (!configurationList) {
    throw new Error(
      `iosReleaseSettings: the target "${WIDGET_TARGET_NAME}" carries no build configuration list in the Xcode project`
    );
  }
  return pinReleaseBuildSettings(
    configurationList,
    xcodeProject.pbxXCBuildConfigurationSection(),
    RELEASE_BUILD_SETTINGS
  );
};

const pinModResults = (config) => {
  pinWidgetTargetRelease(config.modResults);
  return config;
};

// withXcodeProject is the same mod expo-widgets creates its target through, but this SDK's mod
// chain runs a slot's actions in REVERSE registration order (withBaseMod wraps the earlier
// registration as its nextMod), so registering BEFORE expo-widgets is what makes this pin run
// after the target exists - measured: registered after, prebuild fails with the missing-target
// guard; registered before, the generated project.pbxproj carries the pins
const withIosReleaseSettings = (config) => withXcodeProject(config, pinModResults);

module.exports = withIosReleaseSettings;
module.exports.pinReleaseBuildSettings = pinReleaseBuildSettings;
module.exports.pinWidgetTargetRelease = pinWidgetTargetRelease;
module.exports.pinModResults = pinModResults;
module.exports.WIDGET_TARGET_NAME = WIDGET_TARGET_NAME;
module.exports.RELEASE_BUILD_SETTINGS = RELEASE_BUILD_SETTINGS;

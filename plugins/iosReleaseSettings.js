const { withXcodeProject } = require('expo/config-plugins');

// expo-widgets' own config plugin writes its target's build settings itself and pins
// SWIFT_OPTIMIZATION_LEVEL="-Onone" for BOTH Debug and Release while leaving ENABLE_DEBUG_DYLIB
// unset, which defaults YES for that target alone (addXCConfigurationList.js; every other target
// in the generated tree resolves NO). The shipped Release app therefore carried an extension
// built from debug content: an 8.8 MB ExpoWidgetsTarget.debug.dylib, a __preview.dylib and a
// 92 KB stub executable inside PlugIns/ExpoWidgetsTarget.appex (measured on 2.38.4). This plugin
// pins the target's Release configuration; Debug keeps exactly what expo-widgets wrote.
//
// Xcode defaults DEPLOYMENT_POSTPROCESSING to NO for the whole project, which leaves
// STRIP_INSTALLED_PRODUCT and DEAD_CODE_STRIPPING (both default YES) inert: nothing strips the
// installed binaries. Neither the app target nor the extension sets any of the three, so the
// strip pass pins them on the root project's Release configuration and both binaries inherit
// (T-491 step 3; each setting measured alone on the Athan binary against the 27,706,400-byte /
// 12,539-symbol baseline). LLVM_LTO=YES_THIN was measured alone after the strip lever and
// reverted: it links different code (hashes differ) but the stripped binaries land the same
// byte size and symbol count, so it buys nothing for its native-module risk (T-491 step 3).
const WIDGET_TARGET_NAME = 'ExpoWidgetsTarget';

// Quoted the way every value in the generated entry already rides, so the pbxproj writer
// serializes them verbatim
const RELEASE_BUILD_SETTINGS = {
  ENABLE_DEBUG_DYLIB: '"NO"',
  SWIFT_OPTIMIZATION_LEVEL: '"-O"',
};

const PROJECT_RELEASE_BUILD_SETTINGS = {
  DEPLOYMENT_POSTPROCESSING: '"YES"',
  STRIP_INSTALLED_PRODUCT: '"YES"',
  DEAD_CODE_STRIPPING: '"YES"',
};

// The xcode library names a list's build configurations as { value, comment } pairs over the
// entries the section holds, so the walk resolves uuids through both maps
const pinReleaseBuildSettings = (configurationList, buildConfigurationSection, settings, owner) => {
  for (const { value: uuid } of configurationList.buildConfigurations) {
    const entry = buildConfigurationSection[uuid];
    if (entry?.name !== 'Release') continue;
    Object.assign(entry.buildSettings, settings);
    return entry;
  }
  throw new Error(`iosReleaseSettings: the build configuration list for ${owner} carries no Release configuration`);
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
    RELEASE_BUILD_SETTINGS,
    `the target "${WIDGET_TARGET_NAME}"`
  );
};

const pinProjectReleaseSettings = (xcodeProject) => {
  const rootUuid = xcodeProject.hash?.project?.rootObject;
  const project = rootUuid ? xcodeProject.pbxProjectSection()[rootUuid] : undefined;
  const listUuid = project?.buildConfigurationList;
  const configurationList = listUuid ? xcodeProject.pbxXCConfigurationList()[listUuid] : undefined;
  if (!configurationList) {
    throw new Error('iosReleaseSettings: the root PBXProject of the Xcode project carries no build configuration list');
  }
  return pinReleaseBuildSettings(
    configurationList,
    xcodeProject.pbxXCBuildConfigurationSection(),
    PROJECT_RELEASE_BUILD_SETTINGS,
    'the root project'
  );
};

const pinModResults = (config) => {
  pinWidgetTargetRelease(config.modResults);
  pinProjectReleaseSettings(config.modResults);
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
module.exports.pinProjectReleaseSettings = pinProjectReleaseSettings;
module.exports.pinModResults = pinModResults;
module.exports.WIDGET_TARGET_NAME = WIDGET_TARGET_NAME;
module.exports.RELEASE_BUILD_SETTINGS = RELEASE_BUILD_SETTINGS;
module.exports.PROJECT_RELEASE_BUILD_SETTINGS = PROJECT_RELEASE_BUILD_SETTINGS;

const { withInfoPlist } = require('expo/config-plugins');

const PORTRAIT_ONLY = ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown'];

/**
 * Expo force-adds all four orientations to UISupportedInterfaceOrientations~ipad
 * when supportsTablet is on (Apple's multitasking rule), and a stale ~ipad
 * array survives in a warm ios/ dir even with requireFullScreen set. This
 * pins the key to portrait-only so every prebuild reproduces the lock.
 */
const withPortraitOnlyIpad = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults['UISupportedInterfaceOrientations~ipad'] = PORTRAIT_ONLY;
    return config;
  });
};

module.exports = withPortraitOnlyIpad;

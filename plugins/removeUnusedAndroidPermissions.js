const { withAndroidManifest } = require('expo/config-plugins');

const UNUSED_ANDROID_PERMISSIONS = ['android.permission.SYSTEM_ALERT_WINDOW'];

const withUnusedAndroidPermissionsRemoved = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest['uses-permission'];

    if (Array.isArray(permissions)) {
      manifest['uses-permission'] = permissions.filter(
        (entry) => !UNUSED_ANDROID_PERMISSIONS.includes(entry.$?.['android:name'])
      );
    }

    return config;
  });
};

module.exports = withUnusedAndroidPermissionsRemoved;

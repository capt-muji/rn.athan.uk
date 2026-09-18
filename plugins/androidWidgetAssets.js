const fs = require('node:fs');
const path = require('node:path');

/**
 * Copies the pre-rendered Android widget assets (assets/widgets/*.png, see
 * scripts/generate-widget-assets.py) into android/app/src/main/res/drawable-nodpi/
 * so widget layouts can reference them by bare drawable name — the
 * expo-widgets image loader resolves unschemed URIs against the app's
 * drawables. drawable-nodpi keeps Android from density-scaling what the
 * widget already renders at its dp box.
 */
const withAndroidWidgetAssets = (config) => {
  const { withDangerousMod } = require('expo/config-plugins');

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const sourceDir = path.join(projectRoot, 'assets', 'widgets');
      const targetDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'drawable-nodpi');

      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of fs.readdirSync(sourceDir)) {
        if (!file.endsWith('.png')) continue;
        fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      }
      return modConfig;
    },
  ]);
};

module.exports = withAndroidWidgetAssets;

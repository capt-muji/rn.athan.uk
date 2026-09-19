const fs = require('node:fs');
const path = require('node:path');

/**
 * Strips android:targetCellWidth/Height from the appwidget-provider XMLs
 * expo-widgets writes during prebuild. Its config plugin always emits those
 * grid-RELATIVE attributes (the config schema defaults them to 4/2 cells),
 * and Android 12+ launchers prefer them over minWidth, which would pin the
 * widgets to a fixed cell count. The owner's sizing ruling is fractional
 * (small = half the grid width, medium = full) and must hold on 4, 5 and
 * 8 column launchers alike, so the dp-based minWidth arithmetic has to be
 * the only lever the manifest carries.
 */
const withAndroidWidgetGrid = (config) => {
  const { withDangerousMod } = require('expo/config-plugins');

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      if (!fs.existsSync(xmlDir)) return modConfig;

      for (const file of fs.readdirSync(xmlDir)) {
        if (!file.endsWith('.xml')) continue;
        const full = path.join(xmlDir, file);
        const source = fs.readFileSync(full, 'utf8');
        if (!source.includes('<appwidget-provider')) continue;
        const stripped = source
          .replace(/\s+android:targetCellWidth="[^"]*"/g, '')
          .replace(/\s+android:targetCellHeight="[^"]*"/g, '');
        if (stripped !== source) fs.writeFileSync(full, stripped);
      }
      return modConfig;
    },
  ]);
};

module.exports = withAndroidWidgetGrid;

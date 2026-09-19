/**
 * The grid-sizing strip plugin (plugins/androidWidgetGrid.js)
 *
 * expo-widgets always writes android:targetCellWidth/Height into every
 * appwidget-provider XML (its config defaults the cell counts to 4/2), and
 * Android 12+ launchers prefer those grid-RELATIVE attributes over minWidth.
 * A fixed cell count cannot express "half the grid width" across 4, 5 or 8
 * column launchers, so the attributes are stripped after prebuild and the
 * dp-based minWidth arithmetic (160dp small / 400dp medium) rules everywhere.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROVIDER_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
  android:minWidth="160dp"
  android:minHeight="110dp"
  android:targetCellWidth="2"
  android:targetCellHeight="2"
  android:resizeMode="horizontal|vertical"
  android:widgetCategory="home_screen"
  android:initialLayout="@layout/loading"
/>
`;

describe('android widget grid strip plugin', () => {
  it('removes targetCell attributes from every provider xml, keeps the rest, and is idempotent', async () => {
    const plugin = require('../../plugins/androidWidgetGrid') as (config: { mods?: Record<string, unknown> }) => {
      mods?: { android?: Record<string, (modConfig: unknown) => Promise<unknown>> };
    };

    const root = join(tmpdir(), `athan-widget-grid-${Date.now()}`);
    const xmlDir = join(root, 'android', 'app', 'src', 'main', 'res', 'xml');
    mkdirSync(xmlDir, { recursive: true });
    const provider = join(xmlDir, 'prayer_widget_provider.xml');
    const untouched = join(xmlDir, 'unrelated.xml');
    writeFileSync(provider, PROVIDER_XML);
    writeFileSync(untouched, '<layout xmlns:android="http://schemas.android.com/apk/res/android" />');

    const withPlugin = plugin({ mods: {} });
    const androidMods = withPlugin.mods?.android ?? {};
    const modNames = Object.keys(androidMods);
    expect(modNames.length).toBeGreaterThan(0);

    const modConfig = { modRequest: { projectRoot: root }, results: {} };
    await androidMods[modNames[0] as string](modConfig);

    const stripped = readFileSync(provider, 'utf8');
    expect(stripped).not.toContain('targetCellWidth');
    expect(stripped).not.toContain('targetCellHeight');
    expect(stripped).toContain('android:minWidth="160dp"');
    expect(stripped).toContain('android:resizeMode="horizontal|vertical"');
    // The horizontal morph needs room to shrink below the declared span
    expect(stripped).toContain('android:minResizeWidth="160dp"');
    expect(stripped).toContain('android:minResizeHeight="110dp"');
    expect(readFileSync(untouched, 'utf8')).toContain('<layout');

    // Idempotent: a second run changes nothing and does not throw
    await androidMods[modNames[0] as string](modConfig);
    expect(readFileSync(provider, 'utf8')).toBe(stripped);

    expect(existsSync(root)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

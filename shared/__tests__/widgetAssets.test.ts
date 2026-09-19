/**
 * Asset contract for the Android widget drawables
 *
 * - every drawable name the layout references exists as a committed PNG in
 *   assets/widgets/ (a missing drawable renders as an error text node
 *   inside the widget)
 * - the generator's color literals stay a subset of the layout's palette:
 *   the PNGs are baked from the exact iOS palette and must never drift
 * - the config plugin copies the assets into res/drawable-nodpi byte-equal
 *   and idempotently
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LAYOUT_PATH = join(__dirname, '../../widgets/PrayerWidget.tsx');
const GENERATOR_PATH = join(__dirname, '../../scripts/generate-widget-assets.py');
const ASSETS_DIR = join(__dirname, '../../assets/widgets');

const COLOR_LITERAL = /(['"])(#[0-9a-fA-F]{6,8}|rgba\(\s*\d+[^)]*\))\1/g;

const collectColorLiterals = (source: string): string[] => {
  const found: string[] = [];
  for (const match of source.matchAll(COLOR_LITERAL)) {
    found.push(match[2]);
  }
  return found;
};

describe('android widget assets', () => {
  it('every drawable the layout references exists as a committed PNG', () => {
    const EXPECTED = [
      'athan_widget_card_light_small',
      'athan_widget_card_light_medium',
      'athan_widget_card_dark_small',
      'athan_widget_card_dark_medium',
      'athan_widget_pill_standard_light',
      'athan_widget_pill_extra_light',
      'athan_widget_pill_standard_dark',
      'athan_widget_pill_extra_dark',
      'athan_widget_moon_light',
      'athan_widget_moon_dark',
    ];
    const committed = new Set(readdirSync(ASSETS_DIR).map((file) => file.replace(/\.png$/, '')));
    expect([...committed].sort()).toEqual([...EXPECTED].sort());

    // The layout composes drawable names through constants (the pill name is
    // a template literal): every athan_widget_ literal or prefix it spells
    // must belong to that committed set
    const source = readFileSync(LAYOUT_PATH, 'utf8');
    const literals = [...source.matchAll(/['"`](athan_widget_[a-z_]*)['"`]/g)].map((match) => match[1]);
    expect(new Set(literals).size).toBeGreaterThan(5);
    for (const literal of literals) {
      const matches = [...committed].filter((name) => name === literal || name.startsWith(`${literal}_`));
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it('bakes the Android-only card and geometry contract, and keeps every other literal in the layout palette', () => {
    const generator = readFileSync(GENERATOR_PATH, 'utf8');
    const layout = readFileSync(LAYOUT_PATH, 'utf8');

    // Android cards are OPAQUE (owner ruling 2026-09-19): the iOS palette's
    // translucent literals below are deliberately NOT reused, so the exact
    // opaque forms are pinned instead of the subset rule.
    expect(generator).toContain('CARD_LIGHT = css("#fcfcfe")');
    expect(generator).toContain('CARD_DARK = css("#1a1a5c")');
    expect(generator).toContain('CARD_RADIUS_PT = 16');
    // The pill carries vertical padding (2dp above and below its 22dp row)
    // and NO drop shadow on Android: 26dp tall, shadow-free.
    expect(generator).toContain('PILL_W, PILL_H = 140, 26');
    expect(generator).not.toContain('"shadow"');

    const layoutColors = new Set(collectColorLiterals(layout).map((color) => color.replace(/\s/g, '').toLowerCase()));
    expect(layoutColors.size).toBeGreaterThan(10);

    const generatorColors = [...collectColorLiterals(generator).map((color) => color.replace(/\s/g, '').toLowerCase())];
    expect(generatorColors.length).toBeGreaterThan(10);

    const outside = generatorColors.filter(
      (color) => !layoutColors.has(color) && color !== '#fcfcfe' && color !== '#1a1a5c'
    );
    expect(outside).toEqual([]);
  });

  it('the config plugin copies assets into res/drawable-nodpi byte-equal and idempotently', async () => {
    const plugin = require('../../plugins/androidWidgetAssets') as (config: { mods?: Record<string, unknown> }) => {
      mods?: { android?: Record<string, (modConfig: unknown) => Promise<unknown>> };
    };

    const root = join(tmpdir(), `athan-widget-assets-${Date.now()}`);
    const source = join(root, 'assets', 'widgets');
    mkdirSync(source, { recursive: true });
    writeFileSync(join(source, 'athan_widget_probe.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]));

    const withPlugin = plugin({ mods: {} });
    const androidMods = withPlugin.mods?.android ?? {};
    const modNames = Object.keys(androidMods);
    expect(modNames.length).toBeGreaterThan(0);

    const modConfig = { modRequest: { projectRoot: root }, results: {} };
    await androidMods[modNames[0] as string](modConfig);

    const target = join(root, 'android', 'app', 'src', 'main', 'res', 'drawable-nodpi', 'athan_widget_probe.png');
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]));

    // Idempotent: a second run does not throw or duplicate
    await androidMods[modNames[0] as string](modConfig);
    expect(existsSync(target)).toBe(true);

    rmSync(root, { recursive: true, force: true });
  });
});

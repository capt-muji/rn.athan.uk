/**
 * The widget runtime bundle evaluates, on both platforms
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInThisContext } from 'node:vm';

const ROOT = join(__dirname, '..', '..');
const BUILD_BUNDLE = join(ROOT, 'node_modules', 'expo-widgets', 'scripts', 'build-bundle.mjs');

const BUNDLE_TIMEOUT_MS = 120_000;
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

type LoadOutcome = { ok: boolean; message: string };

/**
 * expo-widgets evaluates layouts in a cut-down runtime whose React is its own
 * five-name stub, and ui-globals re-exports the whole @expo/ui platform entry,
 * so every reachable module runs at load. A module-scope call to a global the
 * stub lacks throws here and in no other suite: @expo/ui 58.0.7 blanked every
 * Android card that way while 170 suites stayed green.
 */
const loadWidgetRuntime = (platform: 'android' | 'ios'): LoadOutcome => {
  const workDir = mkdtempSync(join(tmpdir(), 'widget-runtime-'));
  const bundlePath = join(workDir, `ExpoWidgets-${platform}.bundle`);

  try {
    try {
      execFileSync(process.execPath, [BUILD_BUNDLE, ROOT, platform, bundlePath], { stdio: 'pipe' });
    } catch (error) {
      const details = (error as { stderr?: Buffer }).stderr?.toString() ?? String(error);
      return { ok: false, message: `bundle build failed: ${details}` };
    }

    runInThisContext(readFileSync(bundlePath, 'utf8'), { filename: bundlePath });
    return { ok: true, message: '' };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
};

describe('the widget runtime bundle', () => {
  it(
    'evaluates on android',
    () => {
      expect(loadWidgetRuntime('android')).toEqual({ ok: true, message: '' });
    },
    BUNDLE_TIMEOUT_MS
  );

  it(
    'evaluates on ios',
    () => {
      expect(loadWidgetRuntime('ios')).toEqual({ ok: true, message: '' });
    },
    BUNDLE_TIMEOUT_MS
  );

  it('pins both widget packages to one exact version', () => {
    // A range admits 58.0.6 and 58.0.7, the two versions that throw at load
    const { dependencies } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };

    expect(dependencies['@expo/ui']).toMatch(EXACT_VERSION);
    expect(dependencies['expo-widgets']).toMatch(EXACT_VERSION);
  });
});

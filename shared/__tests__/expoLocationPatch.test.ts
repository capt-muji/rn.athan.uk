/**
 * The guard that proves node_modules/expo-location went back after a session-50 experiment
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'verify-expo-location-patch.sh');

const KT_RELATIVE = join('android', 'src', 'main', 'java', 'expo', 'modules', 'location', 'LocationModule.kt');
const SWIFT_RELATIVE = join('ios', 'Providers', 'DeviceHeadingStreamer.swift');

/** The patched Kotlin, reduced to the lines the guard reads */
const PATCHED_KOTLIN = `class LocationModule : Module(), SensorEventListener {
  private fun startWatching() {
    mSensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME)
    mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (System.currentTimeMillis() - mLastUpdate > TIME_DELTA) {
      sendUpdate()
    }
  }

  companion object {
    const val TIME_DELTA = 50f
  }
}
`;

const PATCHED_SWIFT = `internal class DeviceHeadingStreamer: BaseStreamer {
  func start() {
    manager.headingFilter = kCLHeadingFilterNone
    manager.startUpdatingHeading()
  }
}
`;

const PATCHED_CONFIG = `{
  "platforms": ["apple", "android"],
  "android": { "modules": ["expo.modules.location.LocationModule"] }
}
`;

const dirs: string[] = [];

/** A fake node_modules/expo-location, patched as shipped unless an override says otherwise */
const makeTree = (
  overrides: { kotlin?: string; swift?: string; config?: string; withMavenRepo?: boolean; empty?: boolean } = {}
): string => {
  const root = mkdtempSync(join(tmpdir(), 'expo-location-guard-'));
  dirs.push(root);
  if (overrides.empty) return root;

  const pkg = join(root, 'node_modules', 'expo-location');
  mkdirSync(join(pkg, 'android', 'src', 'main', 'java', 'expo', 'modules', 'location'), { recursive: true });
  mkdirSync(join(pkg, 'ios', 'Providers'), { recursive: true });
  writeFileSync(join(pkg, KT_RELATIVE), overrides.kotlin ?? PATCHED_KOTLIN);
  writeFileSync(join(pkg, SWIFT_RELATIVE), overrides.swift ?? PATCHED_SWIFT);
  writeFileSync(join(pkg, 'expo-module.config.json'), overrides.config ?? PATCHED_CONFIG);
  if (overrides.withMavenRepo) mkdirSync(join(pkg, 'android', 'local-maven-repo'), { recursive: true });

  return root;
};

/** The guard's stdout and exit code for a given tree */
const runGuard = (root: string): { output: string; code: number } => {
  try {
    const output = execFileSync('bash', [SCRIPT, root], { encoding: 'utf8' });

    return { output, code: 0 };
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };

    return { output: failure.stdout ?? '', code: failure.status ?? 1 };
  }
};

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
});

describe('the expo-location patch guard', () => {
  it('reports the patch as shipped when every marker is right', () => {
    const { output, code } = runGuard(makeTree());

    expect(output).toContain('PATCH AS SHIPPED');
    expect(code).toBe(0);
  });

  it('refuses a tree whose sensor delay was left at NORMAL', () => {
    const kotlin = PATCHED_KOTLIN.replaceAll('SENSOR_DELAY_GAME', 'SENSOR_DELAY_NORMAL');

    const { output, code } = runGuard(makeTree({ kotlin }));

    expect(output).toContain('SENSOR_DELAY_GAME: 0, expected 2');
    expect(output).toContain('PATCH NOT AS SHIPPED');
    expect(code).toBe(1);
  });

  it('refuses a tree with only one registration restored', () => {
    const kotlin = PATCHED_KOTLIN.replace('SENSOR_DELAY_GAME', 'SENSOR_DELAY_NORMAL');

    const { output, code } = runGuard(makeTree({ kotlin }));

    expect(output).toContain('SENSOR_DELAY_GAME: 1, expected 2');
    expect(code).toBe(1);
  });

  it('refuses a tree whose degree gate came back', () => {
    const kotlin = PATCHED_KOTLIN.replace('const val TIME_DELTA = 50f', 'const val DEGREE_DELTA = 0.0355');

    const { output, code } = runGuard(makeTree({ kotlin }));

    expect(output).toContain('DEGREE_DELTA: present, expected absent');
    expect(code).toBe(1);
  });

  it('refuses a tree whose iOS heading filter was removed', () => {
    const swift = PATCHED_SWIFT.replace('    manager.headingFilter = kCLHeadingFilterNone\n', '');

    const { output, code } = runGuard(makeTree({ swift }));

    expect(output).toContain('kCLHeadingFilterNone: 0, expected 1');
    expect(code).toBe(1);
  });

  it('refuses a tree that declares a publication block', () => {
    const config = PATCHED_CONFIG.replace(
      '"android": {',
      '"publication": { "repository": "local-maven-repo" },\n  "android": {'
    );

    const { output, code } = runGuard(makeTree({ config }));

    expect(output).toContain('publication block: present, expected absent');
    expect(code).toBe(1);
  });

  it('refuses a tree with a local maven repo', () => {
    const { output, code } = runGuard(makeTree({ withMavenRepo: true }));

    expect(output).toContain('local-maven-repo: present, expected absent');
    expect(code).toBe(1);
  });

  it('refuses a root with no expo-location at all', () => {
    const root = makeTree({ empty: true });

    const { output, code } = runGuard(root);

    expect(output).toContain(`expo-location not found under ${root}`);
    expect(code).toBe(1);
  });
});

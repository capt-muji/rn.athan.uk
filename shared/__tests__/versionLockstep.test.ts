/**
 * Keeps the app's version strings in step with each other.
 *
 * Three files carry the version and only one of them is read at runtime.
 * `stores/version.ts` gets it from `app.json` by way of `Constants.expoConfig`,
 * so `app.json` is the version the app believes it is running. `package.json` is
 * the one a person edits by habit, and `android/app/build.gradle` is what a
 * local release APK is stamped with.
 *
 * Bumping `package.json` and forgetting `app.json` is therefore silent and
 * costly: `wasAppUpgraded()` compares the stored version against an unchanged
 * `app.json`, finds them equal, and returns false. The forced notification
 * reschedule that every upgrade depends on never runs, and nothing anywhere
 * reports a problem. The release simply ships with the previous build's
 * schedule.
 *
 * `android/` is gitignored — it is a prebuild output, absent from a fresh clone
 * and absent in CI — so its agreement is asserted only when the file is
 * actually there. Requiring it would turn this into a test that fails for
 * everyone who has not run prebuild, which is the fastest way to get a guard
 * deleted.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const GRADLE_PATH = join(ROOT, 'android', 'app', 'build.gradle');

/** Read separately from each file on purpose: a shared reader would agree with itself. */
const packageJsonVersion = (): unknown => JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const appJsonVersion = (): unknown => JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo?.version;

const gitignoreLines = (): string[] =>
  readFileSync(join(ROOT, '.gitignore'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

const gradleVersionName = (): string | null => {
  if (!existsSync(GRADLE_PATH)) return null;

  const match = readFileSync(GRADLE_PATH, 'utf8').match(/versionName\s+"([^"]+)"/);
  if (!match) throw new Error('versionName not found in android/app/build.gradle');

  return match[1];
};

describe('version lockstep', () => {
  it('declares a usable version in app.json, the only one the app reads', () => {
    // Guards the assertions below from passing on two matching undefineds if the
    // key is ever moved or renamed.
    expect(typeof appJsonVersion()).toBe('string');
    expect(appJsonVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('keeps package.json and app.json on the same version', () => {
    expect(packageJsonVersion()).toBe(appJsonVersion());
  });

  it('keeps the Android versionName in step when a prebuild is present', () => {
    const gradleVersion = gradleVersionName();

    // Absent is the correct state for a fresh clone or CI. Assert the reason
    // rather than just returning: a bare early return would keep passing if the
    // file went missing for some entirely different cause, and this check would
    // look alive while it had quietly stopped running.
    if (gradleVersion === null) {
      expect(gitignoreLines()).toContain('/android');
      return;
    }

    expect(gradleVersion).toBe(appJsonVersion());
  });
});

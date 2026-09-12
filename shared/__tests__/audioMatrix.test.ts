/**
 * Guards the audio matrix across every surface that has to agree
 *
 * The set of sound files is derived in code — `athan${n}.mp3` from the sound
 * sheet's index, `reminder_${slug}_${interval}.mp3` from the prayer arrays and
 * the interval list, and one fixed `reminder.mp3` for Sunrise and the extras —
 * but it is SHIPPED through two hand-maintained surfaces — the assets directory and
 * `app.json`'s expo-notifications `sounds[]` array — and two generated ones, Android's
 * `res/raw` and the iOS bundle, which the expo-notifications config plugin copies from
 * `sounds[]` at prebuild. Nothing checked that any of them agree.
 *
 * The generated pair is still worth asserting for one reason the others cannot cover: the
 * plugin copies but never PRUNES, so a sound removed from `sounds[]` leaves a stale file
 * behind and only these two would see it. They are skipped when the native directories are
 * absent, because both are gitignored build output — a fresh clone, or anyone who has run
 * `yarn clean`, has neither, and generated output must never fail the unit gate.
 *
 * Adding a twelfth prayer or a seventh interval silently adds filenames the code
 * will build and request but which nothing will ship, and every one of those is a
 * notification that fires with the wrong sound or none. These tests close the
 * matrix so that gap fails here instead of on a user's phone.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import getDuration from 'mp3-duration';

import { EXTRAS_ENGLISH, PRAYERS_ENGLISH, REMINDER_INTERVALS } from '@/shared/constants';
import { EXTRAS_NOTIFICATION_SOUND, prayerNameSlug } from '@/shared/notifications';

const ROOT = join(__dirname, '..', '..');
const ATHANS_DIR = join(ROOT, 'assets', 'audio', 'athans');
const REMINDERS_DIR = join(ROOT, 'assets', 'audio', 'reminders');
const ANDROID_RAW_DIR = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'raw');
const IOS_BUNDLE_DIR = join(ROOT, 'ios', 'Athan');

/** Android resource names may only be lowercase letters, digits and underscores, not starting with a digit */
const ANDROID_RESOURCE_NAME = /^[a-z_][a-z0-9_]*$/;

/**
 * The app's own slug, not a copy. A private re-implementation would keep deriving the OLD
 * filename after a slug change and keep comparing it against the OLD files on disk — green
 * while the running code asks for names that do not exist, which is exactly the drift this
 * file exists to catch.
 */
const slug = prayerNameSlug;

/**
 * How many athans the sound sheet offers, read from the source text rather than imported:
 * `assets/audio/index.ts` require()s the mp3 binaries, which jest cannot parse.
 * Same approach athanDurations.test.ts uses for the same reason.
 */
const athanCount = (): number => {
  const source = readFileSync(join(ROOT, 'assets', 'audio', 'index.ts'), 'utf8');
  const match = source.match(/ATHAN_AUDIOS\s*=\s*\[([^\]]*)\]/);

  if (!match) throw new Error('ATHAN_AUDIOS array not found in assets/audio/index.ts');

  return match[1].split('require(').length - 1;
};

/** Every sound file the code can ask for, derived the same way the code derives it */
const expectedSoundFiles = (): string[] => {
  const athans = Array.from({ length: athanCount() }, (_, index) => `athan${index + 1}.mp3`);

  const allPrayers = [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH];
  const reminders = allPrayers.flatMap((prayer) =>
    REMINDER_INTERVALS.map((interval) => `reminder_${slug(prayer)}_${interval}.mp3`)
  );

  return [...athans, ...reminders, EXTRAS_NOTIFICATION_SOUND].sort();
};

const mp3sIn = (dir: string): string[] => readdirSync(dir).filter((name) => name.endsWith('.mp3'));

/** The sounds[] array the expo-notifications plugin ships, as bare filenames */
const appJsonSounds = (): string[] => {
  const appJson = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
  const plugins: unknown[] = appJson.expo.plugins;

  const entry = plugins.find(
    (plugin): plugin is [string, { sounds: string[] }] =>
      Array.isArray(plugin) && plugin[0] === 'expo-notifications' && Array.isArray(plugin[1]?.sounds)
  );

  if (!entry) throw new Error('expo-notifications sounds[] not found in app.json');

  return entry[1].sounds.map((path) => path.split('/').pop() as string).sort();
};

const EXPECTED = expectedSoundFiles();

// =============================================================================
// MATRIX CLOSURE TESTS
// =============================================================================

describe('the audio matrix closes across every surface', () => {
  it('derives 99 files from code: 32 athans, 11 prayers x 6 intervals, one extras sound', () => {
    expect(EXPECTED).toHaveLength(99);
    expect(athanCount()).toBe(32);
    expect(PRAYERS_ENGLISH.length + EXTRAS_ENGLISH.length).toBe(11);
    expect(REMINDER_INTERVALS).toHaveLength(6);
  });

  it('ships exactly those files in assets/, with nothing unreferenced', () => {
    const onDisk = [...mp3sIn(ATHANS_DIR), ...mp3sIn(REMINDERS_DIR)].sort();

    expect(onDisk).toEqual(EXPECTED);
  });

  it('lists exactly those files in app.json sounds[]', () => {
    expect(appJsonSounds()).toEqual(EXPECTED);
  });

  // Generated by prebuild and gitignored: assert only when they exist. The value here is
  // catching a STALE file the plugin never pruned, which no other surface can see.
  const itIfPrebuilt = (dir: string) => (existsSync(dir) ? it : it.skip);

  itIfPrebuilt(ANDROID_RAW_DIR)('ships exactly those files in android res/raw, with none left over', () => {
    expect(mp3sIn(ANDROID_RAW_DIR).sort()).toEqual(EXPECTED);
  });

  itIfPrebuilt(IOS_BUNDLE_DIR)('ships exactly those files in the iOS bundle, with none left over', () => {
    expect(mp3sIn(IOS_BUNDLE_DIR).sort()).toEqual(EXPECTED);
  });

  it('gives every file a legal Android resource name', () => {
    const resourceNames = EXPECTED.map((file) => file.replace(/\.mp3$/, ''));
    const illegal = resourceNames.filter((name) => !ANDROID_RESOURCE_NAME.test(name));

    expect(illegal).toEqual([]);
  });

  it('gives every reminder channel a legal Android channel ID', () => {
    const allPrayers = [...PRAYERS_ENGLISH, ...EXTRAS_ENGLISH];
    const channelIds = allPrayers.flatMap((prayer) =>
      REMINDER_INTERVALS.map((interval) => `reminder_${slug(prayer)}_${interval}`)
    );
    const illegal = channelIds.filter((id) => !ANDROID_RESOURCE_NAME.test(id));

    expect(illegal).toEqual([]);
  });
});

// =============================================================================
// REMINDER AUDIO INTEGRITY TESTS
//
// athanDurations.test.ts decodes the 32 athans. The 67 reminder files carry every
// pre-prayer reminder and every extras at-time alert and had no integrity test at
// all, so a truncated or zero-length file would ship silently. Duration and size
// catch truncation, replacement with an empty file and most format swaps; a file
// of correct length containing digital silence is still not caught, which would
// need PCM decoding.
// =============================================================================

describe('reminder audio integrity', () => {
  const reminderFiles = mp3sIn(REMINDERS_DIR).sort();

  it('decodes every reminder file to a plausible length', async () => {
    const tooShort: string[] = [];

    for (const file of reminderFiles) {
      const seconds: number = await getDuration(join(REMINDERS_DIR, file));
      if (!Number.isFinite(seconds) || seconds < 1) tooShort.push(`${file} (${seconds}s)`);
    }

    expect(tooShort).toEqual([]);
  });

  it('gives every reminder file a non-trivial byte size', () => {
    const tooSmall = reminderFiles.filter((file) => statSync(join(REMINDERS_DIR, file)).size < 4096);

    expect(tooSmall).toEqual([]);
  });
});

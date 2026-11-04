import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createMMKV } from 'react-native-mmkv';

import { __setAssetHash, __setAssetLocalUri } from '@/shared/__mocks__/expo-asset';
import { __deferFileBytes, __setFileBytes } from '@/shared/__mocks__/expo-file-system';
import * as TimeUtils from '@/shared/time';
import type { ISingleApiResponseTransformed } from '@/shared/types';
import * as Database from '@/stores/database';
import * as Timetable from '@/stores/timetable';

/**
 * The reader's contract: warm launches read bytes synchronously, a first-ever
 * launch stages through the asset seam, torn or stale bytes read as absent and
 * restage, the dev window is launch-relative and memoised per sync run, and
 * the legacy day cache is removed once.
 *
 * Prod-path cases set EXPO_PUBLIC_ENV for the duration of the case, because the
 * module reads the env per call; every one restores it in its own afterEach.
 */

const REAL_ARTIFACT = new Uint8Array(
  fs.readFileSync(path.resolve(__dirname, '../../assets/data/london-2026-2076.bin'))
);

// The env split is a build property; the suite mocks the config so each case
// can be a prod, preview or dev build through its env. var,
// because the module under test reads the env at import, before the suite body
// runs: the hoisted undefined is the dev default that import then sees
var mockBuildEnv = 'local';
jest.mock('@/shared/config', () => {
  const actual = jest.requireActual('@/shared/config');
  return {
    ...actual,
    get APP_CONFIG() {
      return { ...actual.APP_CONFIG, env: mockBuildEnv };
    },
    isProd: () => mockBuildEnv === 'prod',
    isPreview: () => mockBuildEnv === 'preview',
  };
});

const timetableStore = () => createMMKV({ id: 'athan-timetable' });

const asProdBuild = () => {
  mockBuildEnv = 'prod';
};

const asDevBuild = () => {
  mockBuildEnv = 'local';
};

const DAY: ISingleApiResponseTransformed = {
  date: '2026-09-10',
  fajr: '04:52',
  sunrise: '06:24',
  dhuhr: '13:03',
  asr: '16:31',
  magrib: '19:30',
  isha: '20:43',
  suhoor: '04:32',
  duha: '06:44',
  istijaba: '18:30',
};

beforeEach(() => {
  jest.useFakeTimers();
  asDevBuild();
  __setFileBytes(REAL_ARTIFACT);
  __setAssetHash('test-asset-hash');
  __setAssetLocalUri('file:///mock/london-2026-2076.bin');
  timetableStore().clearAll();
  Database.database.clearAll();
  Timetable.__resetTimetableForTest();
});

afterEach(() => {
  jest.useRealTimers();
  asDevBuild();
});

describe('the baked-artifact path (prod and preview builds)', () => {
  // The header and day reads below would pass against any well-formed artifact;
  // the digest alone pins WHICH bytes are committed, so a regeneration from
  // changed workbooks cannot land silently (re-pin consciously, with the
  // generator's own checks green, then update the expected hash)
  it('pins the committed artifact bytes by sha256', () => {
    const digest = createHash('sha256').update(REAL_ARTIFACT).digest('hex');
    expect(digest).toBe('fb4a15524cca9506ddc22c291465f89ab95046f5d98e7ac3b91eb502c946d614');
  });

  it('reads nothing before staging and serves the artifact after it', async () => {
    asProdBuild();

    expect(Timetable.getTimetableDay('2027-01-01')).toBeNull();

    await Timetable.ensureTimetableReady();

    expect(Timetable.getTimetableDay('2027-01-01')).not.toBeNull();
    const day = Timetable.getTimetableDay('2027-01-01');
    expect(day?.fajr).toBe('06:26');
    expect(day?.suhoor).toBe('06:06');
    expect(Timetable.getTimetableDay('2025-12-31')).toBeNull();
    expect(Timetable.getTimetableDay('2077-01-01')).toBeNull();
  });

  it('reads a staged artifact synchronously at the next launch', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();

    Timetable.__resetTimetableForTest();
    expect(Timetable.readStagedArtifactAtLaunch()).toBe(true);
    expect(Timetable.getTimetableDay('2027-01-01')?.magrib).toBe('16:05');
  });

  it('restages when the staged bytes are torn, never decoding them', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();

    const torn = REAL_ARTIFACT.slice();
    torn[0] = 'X'.charCodeAt(0);
    timetableStore().set('artifact', torn.buffer.slice(torn.byteOffset, torn.byteOffset + torn.byteLength));
    Timetable.__resetTimetableForTest();

    expect(Timetable.readStagedArtifactAtLaunch()).toBe(false);
    expect(Timetable.getTimetableDay('2027-01-01')).toBeNull();

    await Timetable.ensureTimetableReady();
    expect(Timetable.getTimetableDay('2027-01-01')?.fajr).toBe('06:26');
  });

  it('reads an empty staged buffer as absent and restages', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();

    timetableStore().set('artifact', new ArrayBuffer(0));
    Timetable.__resetTimetableForTest();

    expect(Timetable.readStagedArtifactAtLaunch()).toBe(false);
    await Timetable.ensureTimetableReady();
    expect(Timetable.getTimetableDay('2027-01-01')?.fajr).toBe('06:26');
  });

  it('rejects the stage when the asset bytes are not a timetable', async () => {
    asProdBuild();
    const foreign = new Uint8Array(64);
    __setFileBytes(foreign);

    await expect(Timetable.ensureTimetableReady()).rejects.toThrow('failed its own header validation');
  });

  it('rejects the stage when the asset carries no hash, a bundle metro did not make', async () => {
    asProdBuild();
    __setAssetHash('');

    await expect(Timetable.ensureTimetableReady()).rejects.toThrow('no hash');
  });

  it('rejects the stage when the asset resolves to no local file', async () => {
    asProdBuild();
    __setAssetLocalUri(null);

    await expect(Timetable.ensureTimetableReady()).rejects.toThrow('no local file');
  });

  it('rejects the stage when the asset reads as no bytes', async () => {
    asProdBuild();
    __setFileBytes(new Uint8Array(0));

    await expect(Timetable.ensureTimetableReady()).rejects.toThrow('The timetable asset read as no bytes');
  });

  it('answers an already-staged readiness ask without touching the asset', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();
    __setFileBytes(null);

    await expect(Timetable.ensureTimetableReady()).resolves.toBeUndefined();
  });

  it('shares one in-flight stage between concurrent readiness asks', async () => {
    asProdBuild();
    let resolveBytes: (bytes: Uint8Array) => void = () => {};
    __deferFileBytes(
      () =>
        new Promise<Uint8Array>((resolve) => {
          resolveBytes = resolve;
        })
    );

    const first = Timetable.ensureTimetableReady();
    const second = Timetable.ensureTimetableReady();
    // The deferred read is reached a few microtasks in, past downloadAsync's await
    for (let tick = 0; tick < 10; tick += 1) await Promise.resolve();
    resolveBytes(REAL_ARTIFACT);
    await Promise.all([first, second]);

    expect(Timetable.getTimetableDay('2027-01-01')?.fajr).toBe('06:26');
  });

  it('reads nothing for a date outside the artifact even when staged', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();

    expect(Timetable.getTimetableDay('2025-12-31')).toBeNull();
  });

  it('restages when the asset hash moved, so an update never serves the old timetable', async () => {
    asProdBuild();
    await Timetable.ensureTimetableReady();

    __setAssetHash('a-new-asset-hash');
    Timetable.__resetTimetableForTest();

    expect(Timetable.readStagedArtifactAtLaunch()).toBe(false);
    await Timetable.ensureTimetableReady();
    expect(Timetable.getTimetableDay('2027-01-01')?.fajr).toBe('06:26');
    expect(timetableStore().getString('assetHash')).toBe('a-new-asset-hash');
  });

  it('propagates an asset-read throw from whatever layer it comes, rather than swallowing it', async () => {
    asProdBuild();
    __setFileBytes(null);

    // The mock's own error text is not the contract; the contract is that any
    // read failure reaches the caller instead of arming a half-staged store
    await expect(Timetable.ensureTimetableReady()).rejects.toThrow();
  });

  it('reports the launch read as absent outside a prod or preview build', () => {
    expect(Timetable.readStagedArtifactAtLaunch()).toBe(false);
  });
});

describe('the mock path (dev and test builds)', () => {
  it('refuses to read the mock window when the build env says prod, whatever the config seam claims', () => {
    const previousEnv = process.env.EXPO_PUBLIC_ENV;
    process.env.EXPO_PUBLIC_ENV = 'prod';
    try {
      // The config mock stays dev, so the read takes the mock path and meets the metro gate
      expect(() => Timetable.getTimetableDay('2026-09-11')).toThrow(
        'The mock window was read on a build that serves the baked timetable'
      );
    } finally {
      if (previousEnv === undefined) delete process.env.EXPO_PUBLIC_ENV;
      else process.env.EXPO_PUBLIC_ENV = previousEnv;
    }
  });

  it('serves the launch-relative window, memoised until the next reseed', async () => {
    jest.setSystemTime(new Date('2026-09-11T12:00:00Z'));

    const today = TimeUtils.getTodayDateString();
    expect(Timetable.getTimetableDay(today)?.date).toBe(today);
    expect(Timetable.getTimetableDay(TimeUtils.addDaysToDateString(today, 15))).toBeNull();

    // A day passes inside the open app: the memoised window keeps its snapshot
    jest.setSystemTime(new Date('2026-09-12T12:00:00Z'));
    expect(Timetable.getTimetableDay(today)?.date).toBe(today);

    // The next sync run reseeds onto the new day
    await Timetable.ensureTimetableReady();
    const nextDay = TimeUtils.getTodayDateString();
    expect(Timetable.getTimetableDay(nextDay)?.date).toBe(nextDay);
  });
});

describe('the test seam', () => {
  it('serves exactly the installed days until they are replaced', () => {
    Timetable.__installTimetableDays([DAY]);
    expect(Timetable.getTimetableDay('2026-09-10')).toEqual(DAY);
    expect(Timetable.getTimetableDay('2026-09-11')).toBeNull();

    const replacement: ISingleApiResponseTransformed = { ...DAY, date: '2027-03-01', fajr: '05:00' };
    Timetable.__installTimetableDays([replacement]);
    expect(Timetable.getTimetableDay('2026-09-10')).toBeNull();
    expect(Timetable.getTimetableDay('2027-03-01')?.fajr).toBe('05:00');
  });
});

describe('the one-time legacy day-cache cleanup', () => {
  it('removes API-era day keys and year markers, sparing the width family', async () => {
    Database.database.set('prayer_2026-01-01', JSON.stringify(DAY));
    Database.database.set('prayer_2027-12-31', JSON.stringify(DAY));
    Database.database.set('fetched_years', JSON.stringify({ 2026: true }));
    Database.database.set('prayer_max_name_width_standard', '120');
    Database.database.set('preference_alert_standard_fajr', 'true');

    await Timetable.ensureTimetableReady();

    expect(Database.database.contains('prayer_2026-01-01')).toBe(false);
    expect(Database.database.contains('prayer_2027-12-31')).toBe(false);
    expect(Database.database.contains('fetched_years')).toBe(false);
    expect(Database.database.getString('prayer_max_name_width_standard')).toBe('120');
    expect(Database.database.getString('preference_alert_standard_fajr')).toBe('true');
    expect(Database.database.getString('legacy_day_cache_cleaned')).toBe('done');
  });

  it('runs once ever: keys that appear after the first pass stay', async () => {
    await Timetable.ensureTimetableReady();
    Database.database.set('prayer_2028-05-01', JSON.stringify(DAY));

    await Timetable.ensureTimetableReady();

    expect(Database.database.contains('prayer_2028-05-01')).toBe(true);
  });

  it('leaves the flag unset when the enumeration fails, so the next sync retries', async () => {
    const spy = jest.spyOn(Database.database, 'getAllKeys').mockImplementation(() => {
      throw new Error('store unreadable');
    });

    await Timetable.ensureTimetableReady();

    expect(Database.database.getString('legacy_day_cache_cleaned')).toBeUndefined();
    spy.mockRestore();
  });
});
